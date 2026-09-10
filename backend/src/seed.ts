import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import { TrackerDefinition } from './models/TrackerDefinition';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_tracker';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for Seeding');

    // 1. Create Default Admin
    const email = 'admin@trackos.com';
    let admin = await User.findOne({ email });
    if (!admin) {
      admin = await User.create({
        name: 'TrackOS Admin',
        email,
        passwordHash: 'admin123'
      });
      console.log('Created Admin User: admin@trackos.com / admin123');
    }

    // 2. Clear Existing Templates
    await TrackerDefinition.deleteMany({ ownerId: admin._id });

    // 3. Insert 10 Built-in Templates
    const templates = [
      // ── Personal ──────────────────────────────
      {
        name: 'Daily Planner',
        category: 'Personal',
        description: 'Plan your day with time blocks, priorities, and reflections',
        isTemplate: true,
        ownerId: admin._id,
        fields: [
          { fieldKey: 'wake_time', label: 'Wake Up Time', type: 'text', required: true },
          { fieldKey: 'top_priority', label: 'Top Priority for Today', type: 'text', required: true },
          { fieldKey: 'mood', label: 'Morning Mood', type: 'select', required: true, options: ['Energised 🔥', 'Focused 🎯', 'Calm 😌', 'Tired 😴', 'Anxious 😟'] },
          { fieldKey: 'gratitude', label: 'One Thing I\'m Grateful For', type: 'text', required: false },
          { fieldKey: 'end_of_day_rating', label: 'Day Rating (1-10)', type: 'number', required: false },
        ]
      },
      {
        name: 'Weekly Planner',
        category: 'Personal',
        description: 'Plan your full week with goals, commitments, and review',
        isTemplate: true,
        ownerId: admin._id,
        fields: [
          { fieldKey: 'week_goal', label: 'Main Goal This Week', type: 'text', required: true },
          { fieldKey: 'mon_focus', label: 'Monday Focus', type: 'text', required: false },
          { fieldKey: 'tue_focus', label: 'Tuesday Focus', type: 'text', required: false },
          { fieldKey: 'wed_focus', label: 'Wednesday Focus', type: 'text', required: false },
          { fieldKey: 'thu_focus', label: 'Thursday Focus', type: 'text', required: false },
          { fieldKey: 'fri_focus', label: 'Friday Focus', type: 'text', required: false },
          { fieldKey: 'weekend_plan', label: 'Weekend Plan', type: 'text', required: false },
          { fieldKey: 'week_review', label: 'Weekly Review Note', type: 'text', required: false },
        ]
      },

      // ── Health ────────────────────────────────
      {
        name: 'Health & Fitness',
        category: 'Health',
        description: 'Monitor vital health statistics and wellness habits',
        isTemplate: true,
        ownerId: admin._id,
        fields: [
          { fieldKey: 'weight', label: 'Weight (kg)', type: 'number', required: true },
          { fieldKey: 'sleep_hours', label: 'Sleep Duration (hours)', type: 'number', required: true },
          { fieldKey: 'water_glasses', label: 'Water Intake (glasses)', type: 'number', required: true },
          { fieldKey: 'steps', label: 'Steps Walked', type: 'number', required: false },
          { fieldKey: 'energy', label: 'Energy Level', type: 'select', required: false, options: ['High', 'Medium', 'Low'] },
        ]
      },
      {
        name: 'Fitness Log',
        category: 'Fitness',
        description: 'Log your workouts, reps, sets, and personal records',
        isTemplate: true,
        ownerId: admin._id,
        fields: [
          { fieldKey: 'workout_type', label: 'Workout Type', type: 'select', required: true, options: ['Strength', 'Cardio', 'HIIT', 'Yoga', 'Swimming', 'Cycling', 'Other'] },
          { fieldKey: 'duration_mins', label: 'Duration (minutes)', type: 'number', required: true },
          { fieldKey: 'calories_burned', label: 'Calories Burned', type: 'number', required: false },
          { fieldKey: 'exercise_notes', label: 'Exercises / Notes', type: 'text', required: false },
          { fieldKey: 'pr_achieved', label: 'Personal Record Achieved?', type: 'boolean', required: false },
        ]
      },
      {
        name: 'Meal Planner',
        category: 'Health',
        description: 'Plan and log your meals, macros, and nutrition goals',
        isTemplate: true,
        ownerId: admin._id,
        fields: [
          { fieldKey: 'breakfast', label: 'Breakfast', type: 'text', required: false },
          { fieldKey: 'lunch', label: 'Lunch', type: 'text', required: false },
          { fieldKey: 'dinner', label: 'Dinner', type: 'text', required: false },
          { fieldKey: 'snacks', label: 'Snacks', type: 'text', required: false },
          { fieldKey: 'calories_total', label: 'Total Calories', type: 'number', required: false },
          { fieldKey: 'water_ml', label: 'Water (ml)', type: 'number', required: false },
        ]
      },

      // ── Finance ───────────────────────────────
      {
        name: 'Expense Tracker',
        category: 'Finance',
        description: 'Log your daily spending and categorise expenses',
        isTemplate: true,
        ownerId: admin._id,
        fields: [
          { fieldKey: 'amount', label: 'Amount (₹)', type: 'number', required: true },
          { fieldKey: 'category', label: 'Category', type: 'select', required: true, options: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Other'] },
          { fieldKey: 'description', label: 'Description', type: 'text', required: false },
          { fieldKey: 'payment_mode', label: 'Payment Mode', type: 'select', required: false, options: ['Cash', 'UPI', 'Card', 'Net Banking'] },
        ]
      },

      // ── Study ─────────────────────────────────
      {
        name: 'Study Planner',
        category: 'Study',
        description: 'Plan study sessions, track subjects, and measure focus',
        isTemplate: true,
        ownerId: admin._id,
        fields: [
          { fieldKey: 'subject', label: 'Subject / Topic', type: 'text', required: true },
          { fieldKey: 'study_duration', label: 'Study Time (minutes)', type: 'number', required: true },
          { fieldKey: 'technique', label: 'Study Technique', type: 'select', required: false, options: ['Pomodoro', 'Active Recall', 'Spaced Repetition', 'Mind Map', 'Reading', 'Practice Problems'] },
          { fieldKey: 'difficulty', label: 'Difficulty', type: 'select', required: false, options: ['Easy', 'Medium', 'Hard'] },
          { fieldKey: 'completion', label: 'Session Completion %', type: 'number', required: false },
          { fieldKey: 'notes', label: 'Key Notes / Takeaways', type: 'text', required: false },
        ]
      },

      // ── Work ──────────────────────────────────
      {
        name: 'Project Planner',
        category: 'Work',
        description: 'Plan and track project milestones, tasks, and blockers',
        isTemplate: true,
        ownerId: admin._id,
        fields: [
          { fieldKey: 'project_name', label: 'Project Name', type: 'text', required: true },
          { fieldKey: 'milestone', label: 'Current Milestone', type: 'text', required: true },
          { fieldKey: 'status', label: 'Status', type: 'select', required: true, options: ['Not Started', 'In Progress', 'Blocked', 'In Review', 'Done'] },
          { fieldKey: 'hours_spent', label: 'Hours Spent Today', type: 'number', required: false },
          { fieldKey: 'blocker', label: 'Blocker / Issue', type: 'text', required: false },
          { fieldKey: 'next_step', label: 'Next Step', type: 'text', required: false },
        ]
      },
      {
        name: 'Hackathon Project',
        category: 'Work',
        description: 'Track hackathon progress, tasks, and time spent',
        isTemplate: true,
        ownerId: admin._id,
        fields: [
          { fieldKey: 'task', label: 'Task Name', type: 'text', required: true },
          { fieldKey: 'status', label: 'Status', type: 'select', required: true, options: ['To Do', 'In Progress', 'Done'] },
          { fieldKey: 'hours_spent', label: 'Hours Spent', type: 'number', required: true },
          { fieldKey: 'notes', label: 'Notes', type: 'text', required: false },
        ]
      },

      // ── Personal (Goal) ───────────────────────
      {
        name: 'Goal Tracker',
        category: 'Personal',
        description: 'Break big goals into daily actions and track your momentum',
        isTemplate: true,
        ownerId: admin._id,
        fields: [
          { fieldKey: 'goal', label: 'Goal Name', type: 'text', required: true },
          { fieldKey: 'target_date', label: 'Target Date', type: 'date', required: true },
          { fieldKey: 'progress_pct', label: 'Progress (%)', type: 'number', required: true },
          { fieldKey: 'todays_action', label: 'Today\'s Action Step', type: 'text', required: true },
          { fieldKey: 'obstacle', label: 'Obstacle / Challenge', type: 'text', required: false },
          { fieldKey: 'motivation', label: 'Motivation Note', type: 'text', required: false },
        ]
      },
    ];

    await TrackerDefinition.insertMany(templates);
    console.log(`✅ Seeded ${templates.length} templates successfully!`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedDB();
