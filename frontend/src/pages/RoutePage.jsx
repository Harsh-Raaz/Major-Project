import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import Loader from "../components/Loader";
import { getHospital, getHospitalRoute } from "../api/hospital";

const getHospitalCoordinates = (route) => {
  const hospitalLocation = route?.hospital?.location || {};
  const coordinates = hospitalLocation.coordinates;
  const lat = Number(route?.hospital_lat ?? coordinates?.[1] ?? route?.hospital?.lat ?? hospitalLocation.lat ?? route?.hospital?.latitude);
  const lng = Number(route?.hospital_lng ?? coordinates?.[0] ?? route?.hospital?.lng ?? hospitalLocation.lng ?? route?.hospital?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

export default function RoutePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        try {
          const res = await getHospital(id);
          setRoute({ hospital: res.data });
        } finally {
          setLoading(false);
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await getHospitalRoute(id, latitude, longitude);
            setRoute(res.data);
          } finally {
            setLoading(false);
          }
        },
        async () => {
          toast.error("Could not get your location. Please allow location access.");
          try {
            const res = await getHospital(id);
            setRoute({ hospital: res.data });
          } finally {
            setLoading(false);
          }
        },
      );
    };
    load();
  }, [id]);

  if (loading) return <AppLayout><div className="mt-10 flex justify-center"><Loader /></div></AppLayout>;

  const hospitalLocation = route?.hospital?.location || {};
  const destination = getHospitalCoordinates(route);
  const lat = destination?.lat;
  const lng = destination?.lng;
  const mapUrl = destination
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}&layer=mapnik&marker=${lat},${lng}`
    : "";
  const mapsUrl =
    route?.google_maps_url ||
    (destination ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : "");

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="cc-surface animate-fade-up p-6">
          <p className="cc-eyebrow">Route Guidance</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-[#0A1628]">
            {route?.hospital_name || route?.hospital?.name}
          </h2>
          <p className="mt-2 text-slate-600">
            {route?.hospital_address || hospitalLocation.address}
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
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="cc-btn-primary mt-8 inline-flex"
            >
              Open in Google Maps
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="mt-8 inline-flex cursor-not-allowed rounded-full bg-slate-300 px-5 py-3 text-sm font-semibold text-white"
            >
              Coordinates unavailable
            </button>
          )}
        </div>
        {mapUrl ? (
          <iframe
            title="map"
            src={mapUrl}
            className="min-h-[420px] w-full rounded-[24px] border border-[rgba(0,184,169,0.15)] bg-white shadow-[0_4px_24px_rgba(0,184,169,0.08)]"
          />
        ) : (
          <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white text-slate-500">
            Live map unavailable for this hospital
          </div>
        )}
      </div>
    </AppLayout>
  );
}

