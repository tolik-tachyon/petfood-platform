import { useState, ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../AuthContext';
import { PetContext } from './PetContext';
import { petService } from '../../services/petService';
import { referenceService } from '../../services/referenceService';
import type {
  Pet,
  Species,
  Breed,
  Color,
  Symptom,
  ActivityType,
  ReproductiveStatus,
  ReproductiveSubStatus
} from './types';

const PetProvider = ({ children }: { children: ReactNode }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [reproductiveStatuses, setReproductiveStatuses] = useState<ReproductiveStatus[]>([]);
  const [reproductiveSubStatuses, setReproductiveSubStatuses] = useState<ReproductiveSubStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReference, setIsLoadingReference] = useState(true);

  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (isAuthenticated) {
      fetchReferenceData();
      fetchPets();
    } else {
      setPets([]);
      setSpecies([]);
      setBreeds([]);
      setColors([]);
      setSymptoms([]);
      setActivityTypes([]);
      setReproductiveStatuses([]);
      setReproductiveSubStatuses([]);
      setIsLoadingReference(false);
    }
  }, [isAuthenticated, authLoading]);

  const fetchReferenceData = async () => {
    setIsLoadingReference(true);
    try {
      const [speciesData, colorsData, symptomsData, activityTypesData] = await Promise.all([
        referenceService.fetchSpecies(),
        referenceService.fetchColors(),
        referenceService.fetchSymptoms(),
        referenceService.fetchActivityTypes()
      ]);

      setSpecies(speciesData);
      setColors(colorsData);
      setSymptoms(symptomsData);
      setActivityTypes(activityTypesData);

      if (speciesData.length > 0) {
        const dogSpecies = speciesData.find(s =>
          s.code === 'dog' || s.name.toLowerCase().includes('соба')
        ) || speciesData[0];

        if (dogSpecies) {
          await fetchBreedsBySpeciesId(dogSpecies.id);
        }
      }

      const reproStatuses = await referenceService.fetchReproductiveStatuses('female');
      setReproductiveStatuses(reproStatuses);

      const lactationStatus = reproStatuses.find(s =>
        s.code === 'female_lactation' || s.requiresSubstatus
      );

      if (lactationStatus) {
        const reproSubStatuses = await referenceService.fetchReproductiveSubStatuses(lactationStatus.id);
        setReproductiveSubStatuses(reproSubStatuses);
      }
    } catch (error) {
      console.error("Failed to fetch reference data:", error);
    } finally {
      setIsLoadingReference(false);
    }
  };

  const fetchBreedsBySpeciesId = async (speciesId: number) => {
    const breedsData = await referenceService.fetchBreedsBySpeciesId(speciesId);
    setBreeds(breedsData);
  };

  const fetchPets = async () => {
    setIsLoading(true);
    try {
      const petsData = await petService.fetchPets();
      setPets(petsData);
    } catch (error) {
      console.error("Failed to fetch pets:", error);
      setPets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addPet = async (petData: any): Promise<Pet> => {
    const newPet = await petService.createPet(petData);
    setPets(prevPets => [...prevPets, newPet]);
    return newPet;
  };

  const updatePet = async (id: string, petData: any): Promise<Pet> => {
    const updatedPet = await petService.updatePet(id, petData);
    setPets(prevPets =>
      prevPets.map(pet => (pet.id === id ? updatedPet : pet))
    );
    return updatedPet;
  };

  const deletePet = async (id: string): Promise<void> => {
    await petService.deletePet(id);
    setPets(prevPets => prevPets.filter(pet => pet.id !== id));
    navigate('/dashboard');
  };

  const getPetById = (id: string): Pet | undefined => {
    return pets.find(pet => pet.id === id);
  };

  const getBreedsBySpeciesId = (speciesId: number): Breed[] => {
    return breeds.filter(breed => breed.speciesId === speciesId);
  };

  return (
    <PetContext.Provider value={{
      pets,
      species,
      breeds,
      colors,
      symptoms,
      activityTypes,
      reproductiveStatuses,
      reproductiveSubStatuses,
      isLoading,
      isLoadingReference,
      fetchPets,
      fetchReferenceData,
      fetchBreedsBySpeciesId,
      addPet,
      updatePet,
      deletePet,
      getPetById,
      getBreedsBySpeciesId
    }}>
      {children}
    </PetContext.Provider>
  );
};

export default PetProvider;