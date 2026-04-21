import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getPatientAppointments } from '../api/patient';
import AppLayout from '../layouts/AppLayout';
import Loader from '../components/Loader';
import { Mail, Phone, User, Calendar } from 'lucide-react';
import { getPatient } from '../utils/storage';

export default function Profile() {
  const { user } = useAuth();
  const patient = getPatient();
  const patientId = patient?._id || patient?.id;
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const response = await getPatientAppointments(patientId);
        setAppointments((response.data?.appointments || response.data || []).slice(0, 5));
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

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400" />
            <h2 className="text-2xl font-bold text-blue-950">{user?.name}</h2>
            <p className="mt-1 text-blue-700">
              {user?.role === 'admin' ? 'Administrator' : 'Patient'}
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                <Mail size={20} className="text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600">Email</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                <Phone size={20} className="text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600">Phone</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {user?.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                <User size={20} className="text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600">Member Since</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-blue-950">
              <Calendar size={20} />
              Recent Appointments
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id || appointment._id}
                    className="rounded-lg border border-blue-100 p-4"
                  >
                    <p className="font-semibold text-blue-950">
                      {appointment.doctor_name} - {appointment.department}
                    </p>
                    <p className="text-sm text-blue-700">
                      {appointment.hospital_name}
                    </p>
                    <p className="text-sm text-blue-700">
                      {appointment.date} {appointment.time}
                    </p>
                    <p className="mt-2 text-xs">
                      Status:{' '}
                      <span className="font-semibold text-blue-900">
                        {appointment.status || 'confirmed'}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-blue-700">
                No appointments yet
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
