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
        name: 'City General Hospital',
        location: { address: 'MG Road', city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
        departments: ['General Medicine', 'Cardiology', 'Pediatrics', 'Emergency'],
        rating: { overall: 4.2, patient_experience: 4.0, safety: 4.3 },
        facilities: ['ICU', 'Blood Bank', 'Pharmacy'],
        contact: '080-12345678',
        total_doctors: 25
      },
      {
        name: 'Apollo Hospital',
        location: { address: 'Bannerghatta Road', city: 'Bengaluru', lat: 12.8965, lng: 77.5975 },
        departments: ['Cardiology', 'Neurology', 'Orthopedics', 'Emergency'],
        rating: { overall: 4.7, patient_experience: 4.5, safety: 4.8 },
        facilities: ['ICU', 'MRI', 'Blood Bank'],
        contact: '080-98765432',
        total_doctors: 60
      },
      {
        name: 'Manipal Hospital',
        location: { address: 'Whitefield', city: 'Bengaluru', lat: 12.9698, lng: 77.75 },
        departments: ['Dermatology', 'Pediatrics', 'General Medicine'],
        rating: { overall: 4.4, patient_experience: 4.2, safety: 4.5 },
        facilities: ['ICU', 'Pharmacy'],
        contact: '080-11223344',
        total_doctors: 40
      },
      {
        name: 'Fortis Hospital',
        location: { address: 'Indiranagar', city: 'Bengaluru', lat: 12.9784, lng: 77.6408 },
        departments: ['Cardiology', 'Orthopedics', 'Neurology'],
        rating: { overall: 4.5, patient_experience: 4.3, safety: 4.6 },
        facilities: ['ICU', 'Blood Bank'],
        contact: '080-22334455',
        total_doctors: 50
      }
    ]);

    const doctors = await Doctor.insertMany([
      // General Medicine
      {
        name: 'Dr. Priya Sharma',
        hospital_id: hospitals[0]._id,
        department: 'General Medicine',
        experience_years: 15,
        rating: 4.8,
        avg_consultation_mins: 12,
        max_patients_per_day: 40,
        current_patients_today: 10,
        qualification: 'MBBS, MD'
      },
      {
        name: 'Dr. Ramesh Rao',
        hospital_id: hospitals[0]._id,
        department: 'General Medicine',
        experience_years: 5,
        rating: 4.2,
        avg_consultation_mins: 10,
        max_patients_per_day: 40,
        current_patients_today: 5,
        qualification: 'MBBS'
      },

      // Cardiology
      {
        name: 'Dr. Meena Iyer',
        hospital_id: hospitals[1]._id,
        department: 'Cardiology',
        experience_years: 20,
        rating: 4.9,
        avg_consultation_mins: 15,
        max_patients_per_day: 30,
        current_patients_today: 25,
        qualification: 'MD, DM Cardiology'
      },
      {
        name: 'Dr. Arjun Reddy',
        hospital_id: hospitals[3]._id,
        department: 'Cardiology',
        experience_years: 12,
        rating: 4.6,
        avg_consultation_mins: 14,
        max_patients_per_day: 35,
        current_patients_today: 20,
        qualification: 'MD Cardiology'
      },

      // Pediatrics
      {
        name: 'Dr. Suresh Kumar',
        hospital_id: hospitals[2]._id,
        department: 'Pediatrics',
        experience_years: 10,
        rating: 4.5,
        avg_consultation_mins: 12,
        max_patients_per_day: 35,
        current_patients_today: 12,
        qualification: 'MD Pediatrics'
      },

      // Neurology
      {
        name: 'Dr. Neha Kapoor',
        hospital_id: hospitals[1]._id,
        department: 'Neurology',
        experience_years: 8,
        rating: 4.4,
        avg_consultation_mins: 15,
        max_patients_per_day: 25,
        current_patients_today: 18,
        qualification: 'DM Neurology'
      },

      // Dermatology
      {
        name: 'Dr. Kavya Nair',
        hospital_id: hospitals[2]._id,
        department: 'Dermatology',
        experience_years: 6,
        rating: 4.3,
        avg_consultation_mins: 10,
        max_patients_per_day: 30,
        current_patients_today: 8,
        qualification: 'MD Dermatology'
      }
    ]);

    const today = new Date().toISOString().split('T')[0];

    const slots = [];

    doctors.forEach((doc, i) => {
      for (let hour = 9; hour <= 15; hour += 2) {
        const bookings = Math.floor(Math.random() * 5);
        slots.push({
          doctor_id: doc._id,
          hospital_id: doc.hospital_id,
          date: today,
          start_time: `${hour}:00`,
          end_time: `${hour + 1}:00`,
          capacity: 5,
          current_bookings: bookings,
          status:
            bookings === 5 ? 'full' :
            bookings >= 3 ? 'almost_full' : 'available'
        });
      }
    });

    await Slot.insertMany(slots);

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

    console.log('✅ Strong seeding completed');
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();