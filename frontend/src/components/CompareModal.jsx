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
      <div className="grid gap-4 md:grid-cols-2">
        {[firstHospital, secondHospital].map((hospital) => (
          <div key={hospital._id || hospital.id} className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <h4 className="text-lg font-semibold text-blue-950">{hospital.name}</h4>
            <p className="text-sm text-blue-700">
              {[hospital.location?.address || hospital.address, hospital.location?.city].filter(Boolean).join(", ")}
            </p>
            <div className="mt-3 space-y-1 text-sm text-blue-900">
              <p>Rating: {hospital.rating?.overall ?? hospital.rating ?? "-"}</p>
              <p>Departments: {(hospital.departments || []).join(", ") || "-"}</p>
              <p>Available Doctors: {hospital.available_doctors_count ?? "-"}</p>
              <p>Slots Today: {hospital.available_slots_today ?? "-"}/{hospital.total_slots_today ?? "-"}</p>
              <p>Average Doctor Rating: {hospital.average_doctor_rating?.toFixed?.(1) ?? hospital.average_doctor_rating ?? "-"}</p>
              <p>Contact: {hospital.contact || "-"}</p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

