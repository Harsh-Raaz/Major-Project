//chatbookingpanel
import { CheckCircle2, CircleAlert, RotateCcw, Star, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import SlotCard from "./SlotCard";
import { normalizeAppointment, scoreClass } from "../utils/helpers";

const promptFromReply = (reply = "") => String(reply).split("\n\n")[0];

export const BOOKING_INPUT_LOCKED_STAGES = [
  "choose_hospital",
  "choose_doctor",
  "choose_slot",
  "confirm",
  "no_options",
];

export default function ChatBookingPanel({
  booking,
  picks,
  isSending,
  canConfirm,
  onSelectOption,
  onConfirm,
  onCancel,
  onRetryHospitals,
  onStartOver,
}) {
  if (!booking?.stage) return null;

  const options = Array.isArray(booking.options) ? booking.options : [];
  const prompt = promptFromReply(booking.reply);
  const STAGE_STEP = {
    choose_hospital: 1,
    choose_doctor: 2,
    choose_slot: 3,
    confirm: 4,
    booked: 4,
  };
  const currentStep = STAGE_STEP[booking.stage] ?? null;
  const STEP_LABELS = ['Hospital', 'Doctor', 'Time', 'Confirm'];

  return (
    <div className="cc-chat-enter">
      {currentStep !== null && (
        <div className="mb-4 flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const step = i + 1;
            const done = step < currentStep;
            const active = step === currentStep;
            return (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold
                  ${done ? 'bg-[#00B8A9] text-white' : active ? 'bg-[#0A1628] text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {done ? '✓' : step}
                </div>
                <span className={`text-xs font-medium hidden sm:inline
                  ${active ? 'text-[#0A1628]' : 'text-slate-400'}`}>
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`h-px w-4 ${done ? 'bg-[#00B8A9]' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      )}
      {prompt && ["choose_hospital", "choose_doctor", "choose_slot"].includes(booking.stage) && (
        <p className="mb-3 text-sm leading-6 text-[#0A1628]">{prompt}</p>
      )}

      {booking.stage === "choose_hospital" && (
        <div className="grid gap-3">
          {options.map((hospital, index) => (
            <HospitalChoiceCard
              key={hospital._id || hospital.name || index}
              hospital={hospital}
              disabled={isSending}
              onSelect={() => onSelectOption(index, hospital)}
            />
          ))}
        </div>
      )}

      {booking.stage === "choose_doctor" && (
        <div className="grid gap-3">
          {options.map((doctor, index) => (
            <DoctorChoiceCard
              key={doctor._id || doctor.name || index}
              doctor={doctor}
              disabled={isSending}
              onSelect={() => onSelectOption(index, doctor)}
            />
          ))}
        </div>
      )}

      {booking.stage === "choose_slot" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((slot, index) => (
            <div key={slot._id || slot.id || index} className="grid gap-1">
              {slot.date && <p className="text-xs font-semibold text-slate-600">{slot.date}</p>}
              <SlotCard
                slot={slot}
                onSelect={() => !isSending && onSelectOption(index, slot)}
              />
            </div>
          ))}
        </div>
      )}

      {booking.stage === "confirm" && (
        <ConfirmBookingCard
          reply={booking.reply}
          picks={picks}
          canConfirm={canConfirm}
          isSending={isSending}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}

      {booking.stage === "booked" && (
        <BookedSuccessCard appointment={booking.appointment} picks={picks} reply={booking.reply} />
      )}

      {booking.stage === "no_options" && (
        <StatusCard
          tone="warning"
          title="No options available"
          text={booking.reply || "There are no available options for this choice right now."}
        >
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={onRetryHospitals} className="cc-btn-primary justify-center">
              Try a different hospital
            </button>
            <button type="button" onClick={onStartOver} className="cc-btn-secondary justify-center">
              <RotateCcw size={16} /> Start over
            </button>
          </div>
        </StatusCard>
      )}

      {booking.stage === "cancelled" && (
        <StatusCard
          tone="neutral"
          icon={<XCircle className="h-8 w-8 text-slate-500" />}
          title="Booking cancelled"
          text={booking.reply || "This booking was cancelled."}
        >
          <button type="button" onClick={onStartOver} className="cc-btn-secondary mt-4 justify-center">
            <RotateCcw size={16} /> Start over
          </button>
        </StatusCard>
      )}

      {booking.stage === "failed" && (
        <StatusCard
          tone="error"
          icon={<CircleAlert className="h-8 w-8 text-red-600" />}
          title="Booking failed"
          text={booking.reply || "This appointment could not be completed."}
        >
          <button type="button" onClick={onStartOver} className="cc-btn-secondary mt-4 justify-center">
            <RotateCcw size={16} /> Start over
          </button>
        </StatusCard>
      )}
      {['choose_hospital', 'choose_doctor', 'choose_slot'].includes(booking.stage) && (
        <button
          type="button"
          onClick={onStartOver}
          disabled={isSending}
          className="mt-4 block w-full text-center text-xs text-slate-400 transition hover:text-slate-600 disabled:opacity-50"
        >
          Cancel booking
        </button>
      )}
    </div>
  );
}

function HospitalChoiceCard({ hospital, disabled, onSelect }) {
  const scorePercent = Math.round(Number(hospital.score || 0) * 100);
  const rating = hospital.rating?.overall ?? hospital.rating;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="rounded-[16px] border border-[rgba(0,184,169,0.16)] bg-white p-4 text-left shadow-[0_4px_24px_rgba(0,184,169,0.08)] transition hover:-translate-y-0.5 hover:border-[#00B8A9] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-[#0A1628]">{hospital.name}</h3>
          {hospital.address && <p className="mt-1 text-sm text-slate-500">{hospital.address}</p>}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${scoreClass(Number(hospital.score || 0))}`}>
          {scorePercent}%
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#0A1628]">
        <span>{hospital.distance_km != null ? `${hospital.distance_km} km` : "Distance unavailable"}</span>
        <span className="inline-flex items-center gap-1">
          <Star size={13} className="text-amber-500" aria-hidden="true" />
          {rating ?? "—"}
        </span>
        {hospital.available_slots != null && <span>{hospital.available_slots} slots</span>}
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200">
        <div
          className="h-1.5 rounded-full bg-[#00B8A9]"
          style={{ width: `${Math.min(Math.max(scorePercent, 0), 100)}%` }}
        />
      </div>
    </button>
  );
}

function DoctorChoiceCard({ doctor, disabled, onSelect }) {
  const rating = doctor.rating || "—";
  const experience = doctor.experience_years ?? doctor.experience ?? 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="rounded-[16px] border border-[rgba(0,184,169,0.16)] bg-white p-4 text-left shadow-[0_4px_24px_rgba(0,184,169,0.08)] transition hover:-translate-y-0.5 hover:border-[#00B8A9] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-[#0A1628]">{doctor.name}</h3>
          {doctor.qualification && <p className="mt-1 text-sm text-slate-500">{doctor.qualification}</p>}
        </div>
        {doctor.score != null && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${scoreClass(Number(doctor.score || 0))}`}>
            {Math.round(Number(doctor.score || 0) * 100)}%
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#0A1628]">
        <span className="inline-flex items-center gap-1">
          <Star size={13} className="text-amber-500" aria-hidden="true" />
          {rating}
        </span>
        <span>{experience} years</span>
        {doctor.department && <span>{doctor.department}</span>}
      </div>
    </button>
  );
}

function ConfirmBookingCard({ reply, picks, canConfirm, isSending, onConfirm, onCancel }) {
  return (
    <div className="rounded-[16px] border border-[rgba(0,184,169,0.18)] bg-white p-4">
      <p className="font-display text-xl font-semibold text-[#0A1628]">Confirm this appointment</p>
      <div className="mt-3 grid gap-2 text-sm text-slate-700">
        {picks?.hospital?.name && <p>Hospital: {picks.hospital.name}</p>}
        {picks?.doctor?.name && <p>Doctor: {picks.doctor.name}</p>}
        {picks?.slot && (
          <p>
            Slot: {picks.slot.date ? `${picks.slot.date} ` : ""}{picks.slot.start_time} - {picks.slot.end_time}
          </p>
        )}
        {picks?.department && <p>Department: {picks.department}</p>}
      </div>
      {reply && <p className="mt-3 text-sm leading-6 text-slate-600">{promptFromReply(reply)}</p>}
      {!canConfirm && (
        <p className="mt-3 text-sm text-amber-700">
          Sign in with your CrowdCare account so this booking can be attached to your patient record.{" "}
          <Link to="/login" className="font-semibold underline">
            Login
          </Link>
        </p>
      )}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={isSending || !canConfirm}
          onClick={onConfirm}
          className="cc-btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirm Booking
        </button>
        <button
          type="button"
          disabled={isSending}
          onClick={onCancel}
          className="cc-btn-secondary justify-center"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function BookedSuccessCard({ appointment, picks, reply }) {
  const details = appointment ? normalizeAppointment(appointment) : {};
  const doctorName = details.doctor_name !== "-" ? details.doctor_name : picks?.doctor?.name;
  const hospitalName = details.hospital_name !== "-" ? details.hospital_name : picks?.hospital?.name;
  const returnedSlot = appointment?.slot_id && typeof appointment.slot_id === "object"
    ? appointment.slot_id
    : null;
  const slot = returnedSlot || picks?.slot;
  const date = slot?.date || appointment?.date;
  const time = slot?.start_time && slot?.end_time
    ? `${slot.start_time} - ${slot.end_time}`
    : appointment?.time || null;
  const wait = appointment?.estimated_wait_mins ?? details.estimated_wait_mins;

  return (
    <div className="rounded-[16px] border border-[rgba(0,184,169,0.18)] bg-white p-5 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDF9]">
        <CheckCircle2 className="h-8 w-8 text-[#00B8A9]" />
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-[#0A1628]">Appointment booked</p>
      <p className="mt-2 text-sm text-slate-600">{reply}</p>
      <div className="mt-4 grid gap-2 text-left text-sm text-[#0A1628]">
        {doctorName && <p>Doctor: {doctorName}</p>}
        {hospitalName && <p>Hospital: {hospitalName}</p>}
        {details.department && details.department !== "-" && <p>Department: {details.department}</p>}
        {date && <p>Date: {date}</p>}
        {time && <p>Time: {time}</p>}
        {wait != null && <p>Estimated wait: {wait} minutes</p>}
        {(details.id || appointment?._id) && (
          <p className="text-xs text-slate-500">Reference: {details.id || appointment._id}</p>
        )}
      </div>
      <Link to="/dashboard" className="cc-btn-primary mt-5 inline-flex justify-center">
        View My Appointments
      </Link>
    </div>
  );
}

function StatusCard({ tone, icon, title, text, children }) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-white";

  return (
    <div className={`rounded-[16px] border p-4 ${toneClass}`}>
      {icon && <div className="mb-2">{icon}</div>}
      <p className="font-display text-lg font-semibold text-[#0A1628]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
      {children}
    </div>
  );
}
