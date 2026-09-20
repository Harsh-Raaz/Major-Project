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
        if (!initialDepartment && values.length > 0) {
          setSelectedDept(values[0]?.name || values[0]);
        }
      } catch {
        toast.error("Failed loading departments");
      }
    };
    loadDepartments();
  }, [id, initialDepartment]);

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

  const goToSlots = (doctor) => {
    const doctorId = doctor.id || doctor._id;
    const doctorHospitalId = doctor.hospital_id?._id || doctor.hospital_id || id;
    const params = new URLSearchParams({
      doctorName: doctor.name || "",
      hospitalId: doctorHospitalId,
      hospital: doctor.hospital_name || hospitalName,
      department: doctor.department || selectedDept || "",
      symptoms,
      avgMins: String(doctor.avg_consultation_mins ?? 10),
    });
    navigate(`/slots/${doctorId}?${params.toString()}`);
  };

  return (
    <AppLayout>
      <section className="animate-fade-up">
        <p className="cc-eyebrow">Doctor Discovery</p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-[#0A1628]">
          {hospitalName}
        </h2>
        <p className="mt-2 text-slate-600">
          Select a department to view ranked doctor recommendations.
        </p>
      </section>
      <div className="mt-6 flex flex-wrap gap-2">
        {departments.map((d) => {
          const value = d.name || d;
          return (
            <button
              key={value}
              onClick={() => setSelectedDept(value)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                selectedDept === value
                  ? "bg-[#0A1628] text-white"
                  : "border border-[rgba(0,184,169,0.15)] bg-white text-slate-700"
              }`}
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
              onBook={() => goToSlots(doctor)}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}

