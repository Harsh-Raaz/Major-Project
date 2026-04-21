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
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">{route?.hospital_name || route?.hospital?.name}</h2>
        <p className="text-blue-700">{route?.hospital_address || route?.hospital?.address}</p>
        <p className="mt-4 text-4xl font-bold text-blue-900">{route?.distance_km || 0} km</p>
        <p className="text-blue-700">Estimated travel time: {route?.travel_time_mins || route?.estimated_travel_time || 0} mins</p>
        <a href={route?.google_maps_url} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2 text-white">Open in Google Maps</a>
      </div>
      <iframe title="map" src={mapUrl} className="mt-6 h-[420px] w-full rounded-xl border-0 shadow-sm" />
    </AppLayout>
  );
}

