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

    const hospitals = await Hospital.insertMany([
      {
        name: 'M S Ramaiah Memorial Hospital',
        location: {
          address: ' M S Ramaiah Nagar',
          city: 'Bengaluru',
          lat: 13.028379195967135, 
          lng: 77.56979548453239
        },
        departments: [
          'General Medicine',
          'Cardiology',
          'Pediatrics',
          'Gynecology',
          'Emergency'
        ],
        rating: { overall: 4.2, patient_experience: 4.0, safety: 4.3 },
        facilities: ['ICU', 'Blood Bank', 'Pharmacy', 'Dengue Testing'],
        contact: '080-12345678',
        total_doctors: 25
      },
      {
        name: 'Apollo Hospital',
        location: {
          address: 'Bannerghatta Road',
          city: 'Bengaluru',
          lat: 12.8965,
          lng: 77.5975
        },
        departments: [
          'General Medicine',
          'Neurology',
          'Orthopedics',
          'Cardiology',
          'Emergency'
        ],
        rating: { overall: 4.7, patient_experience: 4.5, safety: 4.8 },
        facilities: ['ICU', 'MRI', 'Blood Bank', 'Pharmacy', 'Dengue Testing'],
        contact: '080-98765432',
        total_doctors: 60
      },
      {
        name: 'Manipal Hospital',
        location: {
          address: 'Whitefield',
          city: 'Bengaluru',
          lat: 12.9698,
          lng: 77.75
        },
        departments: [
          'General Medicine',
          'Gastroenterology',
          'Dermatology',
          'Pediatrics'
        ],
        rating: { overall: 4.4, patient_experience: 4.2, safety: 4.5 },
        facilities: ['ICU', 'Pharmacy', 'Blood Bank'],
        contact: '080-11223344',
        total_doctors: 40
      }
    ]);

    const doctors = await Doctor.insertMany([
      {
        name: 'Dr. Priya Sharma',
        hospital_id: hospitals[0]._id,
        department: 'General Medicine',
        available: true,
        experience_years: 15,
        rating: 4.8,
        avg_consultation_mins: 12,
        max_patients_per_day: 40,
        current_patients_today: 8,
        qualification: 'MBBS, MD',
        bio: 'Specialist in tropical diseases and dengue treatment'
      },
      {
        name: 'Dr. Ramesh Rao',
        hospital_id: hospitals[0]._id,
        department: 'General Medicine',
        available: true,
        experience_years: 5,
        rating: 4.2,
        avg_consultation_mins: 10,
        max_patients_per_day: 40,
        current_patients_today: 4,
        qualification: 'MBBS',
        bio: 'General physician with focus on outpatient care'
      },
      {
        name: 'Dr. Meena Iyer',
        hospital_id: hospitals[1]._id,
        department: 'Cardiology',
        available: true,
        experience_years: 20,
        rating: 4.9,
        avg_consultation_mins: 15,
        max_patients_per_day: 30,
        current_patients_today: 22,
        qualification: 'MBBS, MD, DM Cardiology',
        bio: 'Senior cardiologist with 20 years experience'
      },
      {
        name: 'Dr. Suresh Kumar',
        hospital_id: hospitals[2]._id,
        department: 'Pediatrics',
        available: true,
        experience_years: 10,
        rating: 4.5,
        avg_consultation_mins: 12,
        max_patients_per_day: 35,
        current_patients_today: 12,
        qualification: 'MBBS, MD Pediatrics',
        bio: 'Child specialist with expertise in infectious diseases'
      }
    ]);

    const timeSlots = [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '12:00', end: '13:00' },
      { start: '13:00', end: '14:00' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
      { start: '16:00', end: '17:00' },
      { start: '17:00', end: '18:00' },
      { start: '18:00', end: '19:00' },
      { start: '19:00', end: '20:00' }
    ];

    const slotDocs = [];
    for (let day = 0; day < 7; day += 1) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];

      doctors.forEach((doctor) => {
        timeSlots.forEach((slot) => {
          slotDocs.push({
            doctor_id: doctor._id,
            hospital_id: doctor.hospital_id,
            date: dateStr,
            start_time: slot.start,
            end_time: slot.end,
            capacity: 5,
            current_bookings: 0,
            status: 'available',
            duration_mins: 60
          });
        });
      });
    }

    await Slot.insertMany(slotDocs);

    await Patient.insertMany([
      {
        name: 'Rahul Verma',
        age: 28,
        gender: 'Male',
        phone: '9876543210',
        email: 'rahul@email.com',
        location: { lat: 12.9716, lng: 77.5946, address: 'Koramangala' }
      },
      {
        name: 'Priya Singh',
        age: 35,
        gender: 'Female',
        phone: '8765432109',
        email: 'priya@email.com',
        location: { lat: 12.8965, lng: 77.5975, address: 'BTM Layout' }
      }
    ]);

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
