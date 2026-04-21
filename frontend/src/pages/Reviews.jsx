import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getPatientAppointments } from '../api/patient';
import { api } from '../api/axios';
import Loader from '../components/Loader';
import { Star, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reviews() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [reviews, setReviews] = useState({});
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const res = await getPatientAppointments(user?.id);
        const completed = (res.data?.appointments || res.data || []).filter(
          a => a.status?.toLowerCase() === 'completed'
        );
        setCompletedAppointments(completed);
      } catch (error) {
        console.error('Failed to load appointments', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) loadAppointments();
  }, [user?.id]);

  const handleSubmitReview = async (appointmentId) => {
    if (!reviewForm.text.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reviews', {
        appointment_id: appointmentId,
        patient_id: user?.id,
        rating: reviewForm.rating,
        text: reviewForm.text,
      });

      setReviews({ ...reviews, [appointmentId]: reviewForm });
      setSelectedAppointment(null);
      setReviewForm({ rating: 5, text: '' });
      toast.success('Review submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-950">Reviews & Ratings</h2>
      <p className="mt-2 text-blue-700">Share your experience with doctors and hospitals</p>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Loader />
        </div>
      ) : completedAppointments.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {completedAppointments.map((apt) => (
            <div key={apt.id || apt._id} className="rounded-xl border border-blue-100 bg-white p-6">
              <h3 className="font-bold text-blue-950">{apt.doctor_name}</h3>
              <p className="text-sm text-blue-700">{apt.hospital_name}</p>
              <p className="text-sm text-blue-600">{apt.date} {apt.time}</p>

              {reviews[apt.id || apt._id] ? (
                <div className="mt-4 rounded-lg bg-emerald-50 p-4">
                  <div className="mb-2 flex gap-1">
                    {Array.from({ length: reviews[apt.id || apt._id].rating }).map((_, i) => (
                      <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-emerald-900">{reviews[apt.id || apt._id].text}</p>
                  <p className="mt-2 text-xs text-emerald-700">Review submitted</p>
                </div>
              ) : selectedAppointment === (apt.id || apt._id) ? (
                <div className="mt-4 space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <div>
                    <label className="block text-sm font-semibold text-blue-900">Rating</label>
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
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
                    <label className="block text-sm font-semibold text-blue-900">Your Review</label>
                    <textarea
                      value={reviewForm.text}
                      onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                      className="mt-2 w-full rounded-lg border border-blue-200 px-3 py-2 outline-none ring-blue-300 focus:ring-2"
                      placeholder="Share your experience..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSubmitReview(apt.id || apt._id)}
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {submitting ? <Loader small /> : 'Submit Review'}
                    </button>
                    <button
                      onClick={() => setSelectedAppointment(null)}
                      className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedAppointment(apt.id || apt._id)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  <MessageSquare size={16} />
                  Write Review
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border-2 border-dashed border-blue-100 p-8 text-center">
          <MessageSquare size={40} className="mx-auto mb-3 text-blue-400" />
          <p className="text-lg font-semibold text-blue-900">No completed appointments</p>
          <p className="text-sm text-blue-700">Complete an appointment to share your review</p>
        </div>
      )}
    </div>
  );
}
