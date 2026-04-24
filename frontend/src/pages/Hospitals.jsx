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
        const res = await recommendHospitals(
          department,
          fixedPatient.lat,
          fixedPatient.lng
        );
        const list = (res.data?.hospitals || res.data || []).sort(
          (a, b) => (b.score || 0) - (a.score || 0)
        );
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
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((value) => value !== id)
        : prev.length < 2
          ? [...prev, id]
          : prev
    );
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
    addToSearchHistory({
      id: hospital.id || hospital._id,
      name: hospital.name,
      type: "hospital",
      department,
      rating: hospital.rating?.overall || hospital.rating,
      timestamp: new Date().toISOString(),
    });

    navigate(
      `/doctors/${hospital.id || hospital._id}?hospital=${encodeURIComponent(
        hospital.name
      )}&department=${encodeURIComponent(department)}&symptoms=${encodeURIComponent(
        symptoms
      )}`
    );
  };

  return (
    <AppLayout>
      <section className="animate-fade-up">
        <p className="cc-eyebrow">Hospital Recommendations</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold text-[#0A1628]">
              Department: {department}
            </h2>
            <p className="mt-2 text-slate-600">
              Ranked by relevance, proximity, and available capacity.
            </p>
          </div>
          <button onClick={onCompare} className="cc-btn-primary">
            {comparing ? <Loader small /> : "Compare Selected"}
          </button>
        </div>
      </section>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Loader />
        </div>
      ) : (
        <div className="mt-8 grid gap-5">
          {hospitals.map((hospital, index) => (
            <HospitalCard
              key={hospital.id || hospital._id}
              hospital={hospital}
              recommended={index === 0}
              checked={selected.includes(hospital.id || hospital._id)}
              onToggleCompare={toggleCompare}
              onViewDoctors={() => onViewDoctors(hospital)}
              onRoute={() => navigate(`/route/${hospital.id || hospital._id}`)}
            />
          ))}
        </div>
      )}

      {compareData && (
        <CompareModal data={compareData} onClose={() => setCompareData(null)} />
      )}
    </AppLayout>
  );
}
