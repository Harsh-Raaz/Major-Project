require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const Doctor = require('./models/Doctor');
const Slot = require('./models/Slot');
const Patient = require('./models/Patient');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Hospital.deleteMany({});
    await Doctor.deleteMany({});
    await Slot.deleteMany({});
    await Patient.deleteMany({});

    const commonDepartments = [
      'General Medicine',
      'Cardiology',
      'Orthopedics',
      'Neurology',
      'Dermatology',
      'Pediatrics',
      'Gynecology',
      'Emergency'
    ];

    // ---------------- HOSPITALS ----------------
    const hospitals = await Hospital.insertMany([
      {
        name: 'M S Ramaiah Memorial Hospital',
        location: { address: 'MS Ramaiah Nagar', city: 'Bengaluru', lat: 13.0283, lng: 77.5698 },
        departments: commonDepartments,
        rating: { overall: 4.3, patient_experience: 4.2, safety: 4.4 },
        facilities: ['ICU', 'Blood Bank', 'Pharmacy'],
        contact: '080-11111111',
        total_doctors: 80
      },
      {
        name: 'Apollo Hospital',
        location: { address: 'Bannerghatta Road', city: 'Bengaluru', lat: 12.8965, lng: 77.5975 },
        departments: commonDepartments,
        rating: { overall: 4.7, patient_experience: 4.6, safety: 4.8 },
        facilities: ['ICU', 'MRI', 'Blood Bank'],
        contact: '080-22222222',
        total_doctors: 100
      },
      {
        name: 'Manipal Hospital',
        location: { address: 'Whitefield', city: 'Bengaluru', lat: 12.9698, lng: 77.75 },
        departments: commonDepartments,
        rating: { overall: 4.5, patient_experience: 4.3, safety: 4.6 },
        facilities: ['ICU', 'Pharmacy'],
        contact: '080-33333333',
        total_doctors: 90
      },
      {
        name: 'Fortis Hospital',
        location: { address: 'Indiranagar', city: 'Bengaluru', lat: 12.9784, lng: 77.6408 },
        departments: commonDepartments,
        rating: { overall: 4.6, patient_experience: 4.4, safety: 4.7 },
        facilities: ['ICU', 'Blood Bank'],
        contact: '080-44444444',
        total_doctors: 95
      }
    ]);

    // ---------------- DOCTORS ----------------
    const doctorTemplates = [
      { dept: 'General Medicine', names: ['Dr. Priya Sharma', 'Dr. Ramesh Rao'] },
      { dept: 'Cardiology', names: ['Dr. Meena Iyer', 'Dr. Arjun Reddy'] },
      { dept: 'Orthopedics', names: ['Dr. Vikram Singh', 'Dr. Kiran Patel'] },
      { dept: 'Neurology', names: ['Dr. Neha Kapoor', 'Dr. Rahul Das'] },
      { dept: 'Dermatology', names: ['Dr. Kavya Nair', 'Dr. Sneha Menon'] },
      { dept: 'Pediatrics', names: ['Dr. Suresh Kumar', 'Dr. Anita Joseph'] },
      { dept: 'Gynecology', names: ['Dr. Shalini Gupta', 'Dr. Pooja Mehta'] },
      { dept: 'Emergency', names: ['Dr. Rajiv Nair', 'Dr. Imran Khan'] }
    ];

    const doctorsData = [];

    hospitals.forEach((hospital) => {
      doctorTemplates.forEach((template) => {
        template.names.forEach((name) => {
          doctorsData.push({
            name,
            hospital_id: hospital._id,
            department: template.dept,
            available: true,
            experience_years: Math.floor(Math.random() * 15) + 5,
            rating: (Math.random() * 1 + 4).toFixed(1),
            avg_consultation_mins: 10 + Math.floor(Math.random() * 10),
            max_patients_per_day: 30 + Math.floor(Math.random() * 20),
            current_patients_today: Math.floor(Math.random() * 10),
            qualification: 'MBBS, MD',
            bio: `${template.dept} specialist`
          });
        });
      });
    });

    const doctors = await Doctor.insertMany(doctorsData);

    // ---------------- SLOTS ----------------
    const timeSlots = [
      '09:00','10:00','11:00','12:00',
      '13:00','14:00','15:00','16:00'
    ];

    const slotDocs = [];

    for (let day = 0; day < 5; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];

      doctors.forEach((doc) => {
        timeSlots.forEach((t, i) => {
          slotDocs.push({
            doctor_id: doc._id,
            hospital_id: doc.hospital_id,
            date: dateStr,
            start_time: t,
            end_time: timeSlots[i + 1] || '17:00',
            capacity: 5,
            current_bookings: Math.floor(Math.random() * 5),
            status: 'available',
            duration_mins: 60
          });
        });
      });
    }

    await Slot.insertMany(slotDocs);

    // ---------------- PATIENTS ----------------
    await Patient.insertMany([
      {
        name: 'Rahul Verma',
        age: 28,
        gender: 'Male',
        phone: '9876543210',
        email: 'rahul@email.com',
        location: { lat: 12.9716, lng: 77.5946, address: 'Koramangala' }
      }
    ]);

    console.log('🔥 PERFECT SEEDING DONE');
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();