import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { getHospital } from "../api/hospital";
import { fixedPatient } from "../utils/helpers";

export default function Confirmation() {
  const [searchParams] = useSearchParams();
  const hospitalId = searchParams.get("hospitalId");
  const [hospital, setHospital] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!hospitalId) return;
      try {
        const res = await getHospital(hospitalId);
        setHospital(res.data?.hospital || res.data);
      } catch {
        setHospital(null);
      }
    };
    load();
  }, [hospitalId]);

  const lat = hospital?.location?.lat ?? fixedPatient.lat;
  const lng = hospital?.location?.lng ?? fixedPatient.lng;
  const mapsUrl = `https://www.google.com/maps/dir/${fixedPatient.lat},${fixedPatient.lng}/${lat},${lng}`;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl animate-fade-up">
        <div className="cc-surface overflow-hidden p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F0FDF9]">
            <CheckCircle2 className="h-10 w-10 text-[#00B8A9]" />
          </div>
          <p className="cc-eyebrow mx-auto mt-6 w-fit">Booking Confirmed</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-[#0A1628]">
            Appointment secured successfully
          </h2>
          <p className="mt-4 text-lg text-slate-700">
            {searchParams.get("doctor")} at {searchParams.get("hospital")}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[20px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Time</p>
              <p className="mt-2 font-display text-2xl text-[#0A1628]">
                {searchParams.get("time")}
              </p>
            </div>
            <div className="rounded-[20px] border border-[rgba(245,158,11,0.18)] bg-[#fff7e6] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estimated wait</p>
              <p className="mt-2 font-display text-2xl text-[#0A1628]">
                {searchParams.get("wait")} minutes
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/dashboard" className="cc-btn-primary">
              View My Appointments
            </Link>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="cc-btn-secondary"
            >
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

