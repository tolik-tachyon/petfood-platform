#!/usr/bin/env bash
# Selective Docker Compose deploy: rebuild only services affected by changed files.

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/iot/PetFood/petfood_platforma}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
FULL_DEPLOY="${FULL_DEPLOY:-0}"
SKIP_GIT="${SKIP_GIT:-0}"
DEPLOY_STATE_FILE="${DEPLOY_STATE_FILE:-$PROJECT_DIR/.deploy-last-commit}"
DEPLOY_BEFORE_SHA="${DEPLOY_BEFORE_SHA:-}"
DEPLOY_AFTER_SHA="${DEPLOY_AFTER_SHA:-}"
EMPTY_SHA="0000000000000000000000000000000000000000"

ALL_BUILD_SERVICES=(
  auth-service
  account-service
  pets-service
  notifications-service
  gateway-service
  recommender-api
  frontend
)

cd "$PROJECT_DIR"

log() {
  echo "[deploy] $*" >&2
}

mark_service() {
  SERVICES_TO_BUILD["$1"]=1
}

mark_all_backend() {
  for service in auth-service account-service pets-service notifications-service gateway-service; do
    mark_service "$service"
  done
}

commit_exists() {
  git cat-file -e "${1}^{commit}" 2>/dev/null
}

resolve_old_commit() {
  # 1) Range provided by CI (github.event.before)
  if [[ -n "$DEPLOY_BEFORE_SHA" && "$DEPLOY_BEFORE_SHA" != "$EMPTY_SHA" ]] && commit_exists "$DEPLOY_BEFORE_SHA"; then
    log "Using push range from CI: ${DEPLOY_BEFORE_SHA:0:8}.."
    echo "$DEPLOY_BEFORE_SHA"
    return
  fi

  # 2) Last successfully deployed commit (state file)
  if [[ -f "$DEPLOY_STATE_FILE" ]]; then
    local stored
    stored="$(tr -d '[:space:]' < "$DEPLOY_STATE_FILE")"
    if [[ -n "$stored" && "$stored" != "$EMPTY_SHA" ]] && commit_exists "$stored"; then
      log "Using last deployed commit from state file: ${stored:0:8}"
      echo "$stored"
      return
    fi
  fi

  # 3) HEAD before the git pull in this run
  if [[ -n "${PRE_PULL_HEAD:-}" ]] && commit_exists "$PRE_PULL_HEAD"; then
    log "Using pre-pull HEAD: ${PRE_PULL_HEAD:0:8}"
    echo "$PRE_PULL_HEAD"
    return
  fi

  echo ""
}

save_deploy_state() {
  echo "$NEW_COMMIT" > "$DEPLOY_STATE_FILE"
  log "Saved deploy state: ${NEW_COMMIT:0:8}"
}

declare -A SERVICES_TO_BUILD=()
COMPOSE_CHANGED=0
NGINX_CHANGED=0
DEPLOY_NEEDED=0
PRE_PULL_HEAD=""

if [[ "$SKIP_GIT" != "1" ]]; then
  PRE_PULL_HEAD="$(git rev-parse HEAD)"
  log "Fetching origin/main (current: ${PRE_PULL_HEAD:0:8})"
  git fetch origin main
  git reset --hard origin/main
  NEW_COMMIT="$(git rev-parse HEAD)"
else
  NEW_COMMIT="$(git rev-parse HEAD)"
fi

if [[ -n "$DEPLOY_AFTER_SHA" && "$DEPLOY_AFTER_SHA" != "$EMPTY_SHA" ]] && commit_exists "$DEPLOY_AFTER_SHA"; then
  NEW_COMMIT="$DEPLOY_AFTER_SHA"
fi

OLD_COMMIT="$(resolve_old_commit)"

if [[ "$FULL_DEPLOY" == "1" ]]; then
  log "FULL_DEPLOY=1 — rebuilding all application services"
  for service in "${ALL_BUILD_SERVICES[@]}"; do
    mark_service "$service"
  done
  DEPLOY_NEEDED=1
elif [[ -z "$OLD_COMMIT" ]]; then
  log "Cannot determine previous commit — doing a full rebuild to be safe."
  for service in "${ALL_BUILD_SERVICES[@]}"; do
    mark_service "$service"
  done
  DEPLOY_NEEDED=1
elif [[ "$OLD_COMMIT" == "$NEW_COMMIT" ]]; then
  log "No new commits to deploy (${NEW_COMMIT:0:8})."
  save_deploy_state
  exit 0
else
  log "Changes between ${OLD_COMMIT:0:8}..${NEW_COMMIT:0:8}:"
  CHANGED_FILES="$(git diff --name-only "$OLD_COMMIT" "$NEW_COMMIT")"

  if [[ -z "$CHANGED_FILES" ]]; then
    log "Empty diff. Nothing to deploy."
    save_deploy_state
    exit 0
  fi

  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    log "  - $file"

    case "$file" in
      frontend-main/*)
        mark_service frontend
        DEPLOY_NEEDED=1
        ;;
      nutrient-recommender-main/*)
        mark_service recommender-api
        DEPLOY_NEEDED=1
        ;;
      backend-main/services/auth/*)
        mark_service auth-service
        DEPLOY_NEEDED=1
        ;;
      backend-main/services/account/*)
        mark_service account-service
        DEPLOY_NEEDED=1
        ;;
      backend-main/services/pets/*)
        mark_service pets-service
        DEPLOY_NEEDED=1
        ;;
      backend-main/services/notifications/*)
        mark_service notifications-service
        DEPLOY_NEEDED=1
        ;;
      backend-main/platform/gateway/*)
        mark_service gateway-service
        DEPLOY_NEEDED=1
        ;;
      backend-main/build.gradle|backend-main/settings.gradle|backend-main/gradle/*|backend-main/gradlew|backend-main/gradlew.bat)
        mark_all_backend
        DEPLOY_NEEDED=1
        ;;
      backend-main/*)
        mark_all_backend
        DEPLOY_NEEDED=1
        ;;
      nginx.conf)
        NGINX_CHANGED=1
        DEPLOY_NEEDED=1
        ;;
      docker-compose.yml|docker-compose.local.yml|.env.example)
        COMPOSE_CHANGED=1
        DEPLOY_NEEDED=1
        ;;
      .github/*|*.md|run.sh|webhook_server.py|webhook_setup.sh|scripts/deploy-selective.sh|AGENTS.md|CI_CD.md)
        ;;
      *)
        log "  (ignored path: $file)"
        ;;
    esac
  done <<< "$CHANGED_FILES"
fi

if [[ "$DEPLOY_NEEDED" -eq 0 ]]; then
  log "Only docs/CI files changed. Containers were not restarted."
  save_deploy_state
  exit 0
fi

if [[ ${#SERVICES_TO_BUILD[@]} -gt 0 ]]; then
  mapfile -t SERVICES_SORTED < <(printf '%s\n' "${!SERVICES_TO_BUILD[@]}" | sort)
  log "Rebuilding services: ${SERVICES_SORTED[*]}"

  for service in "${SERVICES_SORTED[@]}"; do
    log "Building and restarting: $service"
    docker compose -f "$COMPOSE_FILE" up -d --build --no-deps "$service"
  done
else
  log "No image rebuild required."
fi

if [[ "$NGINX_CHANGED" -eq 1 ]]; then
  log "Reloading nginx (config changed)"
  docker compose -f "$COMPOSE_FILE" up -d --no-deps nginx
fi

if [[ "$COMPOSE_CHANGED" -eq 1 ]]; then
  log "Applying docker-compose changes"
  docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
fi

log "Deployment finished."
save_deploy_state
docker compose -f "$COMPOSE_FILE" ps
