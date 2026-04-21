import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/axios';
import Loader from '../components/Loader';
import { Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Waitlist() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [waitlist, setWaitlist] = useState([]);

  useEffect(() => {
    const loadWaitlist = async () => {
      try {
        const res = await api.get(`/waitlist?patient_id=${user?.id}`);
        setWaitlist(res.data?.data || res.data || []);
      } catch (error) {
        console.error('Failed to load waitlist', error);
        toast.error('Could not load waitlist');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) loadWaitlist();
  }, [user?.id]);

  const removeFromWaitlist = async (waitlistId) => {
    try {
      await api.delete(`/waitlist/${waitlistId}`);
      setWaitlist(waitlist.filter(w => w.id !== waitlistId && w._id !== waitlistId));
      toast.success('Removed from waitlist');
    } catch (error) {
      toast.error('Failed to remove from waitlist');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-950">Waitlist</h2>
      <p className="mt-2 text-blue-700">View all appointments you're waiting for</p>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Loader />
        </div>
      ) : waitlist.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {waitlist.map((item) => (
            <div key={item.id || item._id} className="rounded-xl border border-yellow-100 bg-yellow-50 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Clock size={20} className="text-yellow-600" />
                    <h3 className="font-bold text-yellow-900">Position #{item.position || 'Unknown'}</h3>
                  </div>
                  <p className="font-semibold text-blue-950">{item.doctor_name || 'Doctor'}</p>
                  <p className="text-sm text-blue-700">{item.hospital_name || 'Hospital'}</p>
                  <p className="text-sm text-blue-700">{item.date || 'TBD'}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="inline-block rounded-full bg-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-800">
                      {item.status || 'waiting'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromWaitlist(item.id || item._id)}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border-2 border-dashed border-blue-100 p-8 text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-blue-400" />
          <p className="text-lg font-semibold text-blue-900">No waitlist items</p>
          <p className="text-sm text-blue-700">You're not waiting for any appointments</p>
        </div>
      )}
    </div>
  );
}
