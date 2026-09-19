import { useState, useEffect } from 'react';
import { api } from '../api/axios';
import AppLayout from '../layouts/AppLayout';
import Loader from '../components/Loader';
import { Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPatient } from '../utils/storage';

export default function Waitlist() {
  const patient = getPatient();
  const patientId = patient?._id || patient?.id;
  const [loading, setLoading] = useState(true);
  const [waitlist, setWaitlist] = useState([]);

  useEffect(() => {
    const loadWaitlist = async () => {
      try {
        const response = await api.get(`/waitlist?patient_id=${patientId}`);
        setWaitlist(response.data?.data || response.data || []);
      } catch (error) {
        console.error('Failed to load waitlist', error);
        toast.error('Could not load waitlist');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadWaitlist();
    } else {
      setLoading(false);
    }
  }, [patientId]);

  const removeFromWaitlist = async (waitlistId) => {
    try {
      await api.delete(`/waitlist/${waitlistId}`);
      setWaitlist(
        waitlist.filter(
          (item) => item.id !== waitlistId && item._id !== waitlistId
        )
      );
      toast.success('Removed from waitlist');
    } catch {
      toast.error('Failed to remove from waitlist');
    }
  };

  return (
    <AppLayout>
      <div>
        <h2 className="text-2xl font-bold text-[#0A1628]">Waitlist</h2>
        <p className="mt-2 text-slate-600">
          View all appointments you're waiting for
        </p>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <Loader />
          </div>
        ) : waitlist.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {waitlist.map((item) => (
              <div
                key={item.id || item._id}
                className="rounded-xl border border-yellow-100 bg-yellow-50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Clock size={20} className="text-yellow-600" />
                      <h3 className="font-bold text-yellow-900">
                        Position #{item.position || 'Unknown'}
                      </h3>
                    </div>
                    <p className="font-semibold text-[#0A1628]">
                      {item.doctor_name || item.doctor_id?.name || 'Doctor'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {item.hospital_name || item.hospital_id?.name || 'Hospital'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {item.date || item.slot_id?.date || 'TBD'}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className="inline-block rounded-full bg-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-800">
                        {item.status || 'waiting'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromWaitlist(item.id || item._id)}
                    className="cc-btn-secondary"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="cc-surface mt-10 border-2 border-dashed border-blue-100 p-8 text-center">
            <AlertCircle size={40} className="mx-auto mb-3 text-blue-400" />
            <p className="text-lg font-semibold text-[#0A1628]">
              No waitlist items
            </p>
            <p className="text-sm text-slate-600">
              You're not waiting for any appointments
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
