import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import Loader from "../components/Loader";
import DoctorCard from "../components/DoctorCard";
import { getHospitalDepartments } from "../api/hospital";
import { recommendDoctors } from "../api/ai";

export default function Doctors() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hospitalName = searchParams.get("hospital") || "";
  const initialDepartment = searchParams.get("department") || "";
  const symptoms = searchParams.get("symptoms") || "";
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(initialDepartment);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await getHospitalDepartments(id);
        const values = res.data?.departments || res.data || [];
        setDepartments(values);
        if (!selectedDept && values.length > 0) setSelectedDept(values[0]?.name || values[0]);
      } catch {
        toast.error("Failed loading departments");
      }
    };
    loadDepartments();
  }, [id, selectedDept]);

  useEffect(() => {
    if (!selectedDept) return;
    const loadDoctors = async () => {
      setLoading(true);
      try {
        const res = await recommendDoctors(id, selectedDept);
        const list = (res.data?.doctors || res.data || []).sort((a, b) => (b.score || 0) - (a.score || 0));
        setDoctors(list);
      } catch {
        toast.error("Failed loading doctors");
      } finally {
        setLoading(false);
      }
    };
    loadDoctors();
  }, [id, selectedDept]);

  return (
    <AppLayout>
      <h2 className="text-2xl font-bold">{hospitalName}</h2>
      <p className="text-blue-700">Select department to see doctor recommendations</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {departments.map((d) => {
          const value = d.name || d;
          return (
            <button
              key={value}
              onClick={() => setSelectedDept(value)}
              className={`rounded-full px-4 py-2 text-sm ${selectedDept === value ? "bg-blue-600 text-white" : "border border-blue-200 bg-white text-blue-700"}`}
            >
              {value}
            </button>
          );
        })}
      </div>
      {loading ? (
        <div className="mt-8 flex justify-center">
          <Loader />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {doctors.map((doctor, index) => (
            <DoctorCard
              key={doctor.id || doctor._id}
              doctor={doctor}
              bestMatch={index === 0}
              onBook={() =>
                navigate(
                  `/slots/${doctor.id || doctor._id}?doctorName=${encodeURIComponent(doctor.name)}&hospitalId=${id}&hospital=${encodeURIComponent(
                    hospitalName,
                  )}&department=${encodeURIComponent(selectedDept)}&symptoms=${encodeURIComponent(symptoms)}&avgMins=${
                    doctor.avg_consultation_mins ?? 10
                  }`,
                )
              }
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}

