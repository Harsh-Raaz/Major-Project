import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import Loader from "../components/Loader";
import HospitalCard from "../components/HospitalCard";
import CompareModal from "../components/CompareModal";
import { compareHospitals } from "../api/hospital";
import { recommendHospitals } from "../api/ai";
import { fixedPatient } from "../utils/helpers";
import { addToSearchHistory } from "../utils/storage";

const getHospitalCoordinates = (hospital) => {
  const coordinates = hospital.location?.coordinates;
  const lat = Number(coordinates?.[1] ?? hospital.location?.lat ?? hospital.lat ?? hospital.latitude);
  const lng = Number(coordinates?.[0] ?? hospital.location?.lng ?? hospital.lng ?? hospital.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

export default function Hospitals() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const department = searchParams.get("department") || "General Medicine";
  const symptoms = searchParams.get("symptoms") || "";
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [selected, setSelected] = useState([]);
  const [compareData, setCompareData] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await recommendHospitals(department, fixedPatient.lat, fixedPatient.lng);
        const list = (res.data?.hospitals || res.data || []).sort((a, b) => (b.score || 0) - (a.score || 0));
        setHospitals(list);
      } catch {
        toast.error("Could not load hospitals");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [department]);

  const toggleCompare = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : prev.length < 2 ? [...prev, id] : prev));
  };

  const onCompare = async () => {
    if (selected.length !== 2) return toast.error("Select exactly two hospitals");
    setComparing(true);
    try {
      const res = await compareHospitals(selected);
      setCompareData(res.data);
    } catch {
      toast.error("Comparison failed");
    } finally {
      setComparing(false);
    }
  };

  const onViewDoctors = (hospital) => {
    // Track search history
    addToSearchHistory({
      id: hospital.id || hospital._id,
      name: hospital.name,
      type: 'hospital',
      department: department,
      rating: hospital.rating?.overall,
      timestamp: new Date().toISOString(),
    });

    navigate(
      `/doctors/${hospital.id || hospital._id}?hospital=${encodeURIComponent(hospital.name)}&department=${encodeURIComponent(
        department,
      )}&symptoms=${encodeURIComponent(symptoms)}`,
    );
  };

  const onGetRoute = (hospital) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const destination = getHospitalCoordinates(hospital);

        if (!destination) {
          toast.error("Hospital location coordinates are not available");
          return;
        }

        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destination.lat},${destination.lng}`,
          "_blank",
        );
      },
      () => toast.error("Could not get your location. Please allow location access."),
    );
  };

  return (
    <AppLayout>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Department: {department}</h2>
        <button onClick={onCompare} className="rounded-lg bg-blue-600 px-4 py-2 text-white">
          {comparing ? <Loader small /> : "Compare Selected"}
        </button>
      </div>
      {loading ? (
        <div className="mt-10 flex justify-center">
          <Loader />
        </div>
      ) : (
        <div className="grid gap-5">
          {hospitals.map((hospital, index) => (
            <HospitalCard
              key={hospital.id || hospital._id}
              hospital={hospital}
              recommended={index === 0}
              checked={selected.includes(hospital.id || hospital._id)}
              onToggleCompare={toggleCompare}
              onViewDoctors={() => onViewDoctors(hospital)}
              onRoute={() => onGetRoute(hospital)}
            />
          ))}
        </div>
      )}
      {compareData && <CompareModal data={compareData} onClose={() => setCompareData(null)} />}
    </AppLayout>
  );
}

