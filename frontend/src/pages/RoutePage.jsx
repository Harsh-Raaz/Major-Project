import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import Loader from "../components/Loader";
import { getHospitalRoute } from "../api/hospital";
import { fixedPatient } from "../utils/helpers";

export default function RoutePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getHospitalRoute(id, fixedPatient.lat, fixedPatient.lng);
        setRoute(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <AppLayout><div className="mt-10 flex justify-center"><Loader /></div></AppLayout>;

  const lat = route?.hospital_lat || route?.hospital?.lat || fixedPatient.lat;
  const lng = route?.hospital_lng || route?.hospital?.lng || fixedPatient.lng;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="cc-surface animate-fade-up p-6">
          <p className="cc-eyebrow">Route Guidance</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-[#0A1628]">
            {route?.hospital_name || route?.hospital?.name}
          </h2>
          <p className="mt-2 text-slate-600">
            {route?.hospital_address || route?.hospital?.address}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[20px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Distance</p>
              <p className="mt-2 font-display text-3xl text-[#0A1628]">
                {route?.distance_km || 0} km
              </p>
            </div>
            <div className="rounded-[20px] border border-[rgba(245,158,11,0.18)] bg-[#fff7e6] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Travel time</p>
              <p className="mt-2 font-display text-3xl text-[#0A1628]">
                {route?.estimated_travel_mins || route?.travel_time_mins || 0} mins
              </p>
            </div>
          </div>
          <a
            href={route?.google_maps_url}
            target="_blank"
            rel="noreferrer"
            className="cc-btn-primary mt-8 inline-flex"
          >
            Open in Google Maps
          </a>
        </div>
        <iframe
          title="map"
          src={mapUrl}
          className="min-h-[420px] w-full rounded-[24px] border border-[rgba(0,184,169,0.15)] bg-white shadow-[0_4px_24px_rgba(0,184,169,0.08)]"
        />
      </div>
    </AppLayout>
  );
}

