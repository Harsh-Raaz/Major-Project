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

  const lat = hospital?.lat ?? fixedPatient.lat;
  const lng = hospital?.lng ?? fixedPatient.lng;
  const mapsUrl = `https://www.google.com/maps/dir/${fixedPatient.lat},${fixedPatient.lng}/${lat},${lng}`;

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
        <h2 className="mt-3 text-3xl font-bold text-green-700">Appointment Confirmed</h2>
        <p className="mt-2 text-blue-900">{searchParams.get("doctor")} at {searchParams.get("hospital")}</p>
        <p className="text-blue-700">Time: {searchParams.get("time")}</p>
        <p className="mt-3 text-xl font-semibold text-blue-900">Estimated wait: {searchParams.get("wait")} minutes</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/dashboard" className="rounded-lg bg-blue-600 px-4 py-2 text-white">View My Appointments</Link>
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-blue-200 px-4 py-2 text-blue-700">Get Directions</a>
        </div>
      </div>
    </AppLayout>
  );
}

