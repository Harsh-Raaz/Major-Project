import { useState, useEffect } from 'react';
import { getPatientAppointments } from '../api/patient';
import { api } from '../api/axios';
import AppLayout from '../layouts/AppLayout';
import Loader from '../components/Loader';
import { Star, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPatient } from '../utils/storage';

export default function Reviews() {
  const patient = getPatient();
  const patientId = patient?._id || patient?.id;
  const [loading, setLoading] = useState(true);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [reviews, setReviews] = useState({});
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const response = await getPatientAppointments(patientId);
        const completed = (response.data?.appointments || response.data || []).filter(
          (appointment) => appointment.status?.toLowerCase() === 'completed'
        );
        setCompletedAppointments(completed);
      } catch (error) {
        console.error('Failed to load appointments', error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadAppointments();
    } else {
      setLoading(false);
    }
  }, [patientId]);

  const handleSubmitReview = async (appointmentId) => {
    if (!reviewForm.text.trim()) {
      toast.error('Please write a review');
      return;
    }

    if (!patientId) {
      toast.error('Patient not found');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reviews', {
        appointment_id: appointmentId,
        patient_id: patientId,
        rating: reviewForm.rating,
        text: reviewForm.text,
      });

      setReviews({ ...reviews, [appointmentId]: reviewForm });
      setSelectedAppointment(null);
      setReviewForm({ rating: 5, text: '' });
      toast.success('Review submitted successfully!');
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div>
        <h2 className="text-2xl font-bold text-[#0A1628]">Reviews & Ratings</h2>
        <p className="mt-2 text-slate-600">
          Share your experience with doctors and hospitals
        </p>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <Loader />
          </div>
        ) : completedAppointments.length > 0 ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {completedAppointments.map((appointment) => (
              <div
                key={appointment.id || appointment._id}
                className="cc-surface p-6"
              >
                <h3 className="font-bold text-[#0A1628]">
                  {appointment.doctor_name}
                </h3>
                <p className="text-sm text-slate-600">
                  {appointment.hospital_name}
                </p>
                <p className="text-sm text-slate-600">
                  {appointment.date} {appointment.time}
                </p>

                {reviews[appointment.id || appointment._id] ? (
                  <div className="mt-4 rounded-lg bg-emerald-50 p-4">
                    <div className="mb-2 flex gap-1">
                      {Array.from({
                        length: reviews[appointment.id || appointment._id].rating,
                      }).map((_, index) => (
                        <Star
                          key={index}
                          size={18}
                          className="fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-emerald-900">
                      {reviews[appointment.id || appointment._id].text}
                    </p>
                    <p className="mt-2 text-xs text-emerald-700">
                      Review submitted
                    </p>
                  </div>
                ) : selectedAppointment === (appointment.id || appointment._id) ? (
                  <div className="mt-4 space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#0A1628]">
                        Rating
                      </label>
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() =>
                              setReviewForm({ ...reviewForm, rating: star })
                            }
                            className="text-2xl"
                          >
                            <Star
                              size={24}
                              className={
                                star <= reviewForm.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#0A1628]">
                        Your Review
                      </label>
                      <textarea
                        value={reviewForm.text}
                        onChange={(event) =>
                          setReviewForm({
                            ...reviewForm,
                            text: event.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-lg border border-blue-200 px-3 py-2 outline-none ring-blue-300 focus:ring-2"
                        placeholder="Share your experience..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleSubmitReview(appointment.id || appointment._id)
                        }
                        disabled={submitting}
                        className="cc-btn-primary flex-1 disabled:opacity-50"
                      >
                        {submitting ? <Loader small /> : 'Submit Review'}
                      </button>
                      <button
                        onClick={() => setSelectedAppointment(null)}
                        className="cc-btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setSelectedAppointment(appointment.id || appointment._id)
                    }
                    className="cc-btn-secondary mt-4 flex w-full items-center justify-center gap-2"
                  >
                    <MessageSquare size={16} />
                    Write Review
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="cc-surface mt-10 border-2 border-dashed border-blue-100 p-8 text-center">
            <MessageSquare size={40} className="mx-auto mb-3 text-blue-400" />
            <p className="text-lg font-semibold text-[#0A1628]">
              No completed appointments
            </p>
            <p className="text-sm text-slate-600">
              Complete an appointment to share your review
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
