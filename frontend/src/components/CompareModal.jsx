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
          {hospitals.slice(0, 2).map((hospital, index) => (
            <div
              key={hospital.id || index}
              className="rounded-[20px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-5"
            >
              <h4 className="font-display text-xl font-semibold text-[#0A1628]">
                {hospital.name}
              </h4>
              <p className="mt-2 text-sm text-slate-600">{hospital.address}</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                <p>Rating: {hospital.rating ?? "-"}</p>
                <p>Distance: {hospital.distance_km ?? hospital.distance ?? "-"} km</p>
                <p>Slots Today: {hospital.available_slots_today ?? "-"}</p>
                <p>Score: {hospital.score ?? "-"}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <pre className="rounded-[20px] bg-slate-50 p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </Modal>
  );
}
