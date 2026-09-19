import { useState, useCallback } from 'react';
import { getPatient, setPatient, clearPatient } from '../utils/storage';

export const usePatient = () => {
  const [patient, setPatientState] = useState(() => getPatient());

  const setCurrentPatient = useCallback((patientData) => {
    if (patientData) {
      setPatient(patientData);
      setPatientState(patientData);
    }
  }, []);

  const getCurrentPatient = useCallback(() => {
    return patient;
  }, [patient]);

  const clearCurrentPatient = useCallback(() => {
    clearPatient();
    setPatientState(null);
  }, []);

  return {
    patient,
    setCurrentPatient,
    getCurrentPatient,
    clearCurrentPatient,
  };
};
