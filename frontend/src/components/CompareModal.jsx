import Modal from "./Modal";

export default function CompareModal({ data, onClose }) {
  const hospitals = Array.isArray(data) ? data : data?.hospitals || data?.comparison || [];
  const [firstHospital, secondHospital] = hospitals;

  if (!firstHospital || !secondHospital) {
    return (
      <Modal title="Hospital Comparison" onClose={onClose}>
        <p className="text-sm text-blue-700">No comparison data available</p>
      </Modal>
    );
  }

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
              <p className="mt-2 text-sm text-slate-600">
                {[
                  hospital.location?.address || hospital.address,
                  hospital.location?.city,
                ]
                  .filter(Boolean)
                  .join(", ") || "Address unavailable"}
              </p>
              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                <p>Rating: {hospital.rating?.overall ?? hospital.rating ?? "-"}</p>
                <p>Distance: {
                  hospital.distance_km ??
                  hospital.distance ??
                  hospital.distanceKm ??
                  "Not calculated in comparison view"
                } {(hospital.distance_km ?? hospital.distance) ? "km" : ""}</p>
                <p>Departments: {(hospital.departments || []).join(", ") || "-"}</p>
                <p>Available Doctors: {hospital.available_doctors_count ?? "-"}</p>
                <p>Slots Today: {hospital.available_slots_today ?? "-"}</p>
                <p>
                  Avg Doctor Rating:{" "}
                  {hospital.average_doctor_rating?.toFixed?.(1) ??
                    hospital.average_doctor_rating ??
                    "-"}
                </p>
                <p>Contact: {hospital.contact || "-"}</p>
                <p>Score: {hospital.score ? `${Math.round(hospital.score * 100)}%` : "See hospital list for score"}</p>
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
