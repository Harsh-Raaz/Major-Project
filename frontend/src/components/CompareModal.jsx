import Modal from "./Modal";

export default function CompareModal({ data, onClose }) {
  const hospitals = Array.isArray(data?.hospitals)
    ? data.hospitals
    : Array.isArray(data?.comparison)
      ? data.comparison
      : Array.isArray(data)
        ? data
        : [];

  return (
    <Modal title="Hospital Comparison" onClose={onClose}>
      {hospitals.length >= 2 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {hospitals.slice(0, 2).map((hospital, idx) => (
            <div key={hospital.id || idx} className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h4 className="text-lg font-semibold text-blue-950">{hospital.name}</h4>
              <p className="text-sm text-blue-700">{hospital.address}</p>
              <div className="mt-3 space-y-1 text-sm text-blue-900">
                <p>Rating: {hospital.rating ?? "-"}</p>
                <p>Distance: {hospital.distance_km ?? hospital.distance ?? "-"} km</p>
                <p>Slots Today: {hospital.available_slots_today ?? "-"}</p>
                <p>Score: {hospital.score ?? "-"}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <pre className="rounded-lg bg-slate-50 p-3 text-xs">{JSON.stringify(data, null, 2)}</pre>
      )}
    </Modal>
  );
}

