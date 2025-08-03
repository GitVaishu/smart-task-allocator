// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Sample data - we'll move this to JSON files later
let teamData = {
  members: [
    {
      id: 1,
      name: "Alice Johnson",
      skills: ["React", "JavaScript", "CSS"],
      skillLevels: { "React": 8, "JavaScript": 9, "CSS": 7 },
      currentWorkload: 0,
      maxCapacity: 40
    },
    {
      id: 2,
      name: "Bob Smith",
      skills: ["Node.js", "JavaScript", "MongoDB"],
      skillLevels: { "Node.js": 7, "JavaScript": 8, "MongoDB": 6 },
      currentWorkload: 0,
      maxCapacity: 35
    },
    {
      id: 3,
      name: "Carol Davis",
      skills: ["Python", "React", "JavaScript"],
      skillLevels: { "Python": 9, "React": 6, "JavaScript": 8 },
      currentWorkload: 0,
      maxCapacity: 45
    }
  ],
  tasks: [
    {
      id: 1,
      title: "Build Login Component",
      description: "Create reusable login component with form validation",
      requiredSkills: ["React", "JavaScript"],
      estimatedHours: 8,
      priority: "high",
      deadline: "2025-08-10",
      assignedTo: null
    },
    {
      id: 2,
      title: "Setup Database Schema",
      description: "Design and implement user authentication database",
      requiredSkills: ["MongoDB", "Node.js"],
      estimatedHours: 12,
      priority: "medium",
      deadline: "2025-08-12",
      assignedTo: null
    },
    {
      id: 3,
      title: "Create API Documentation",
      description: "Document all REST API endpoints",
      requiredSkills: ["JavaScript", "Node.js"],
      estimatedHours: 6,
      priority: "low",
      deadline: "2025-08-15",
      assignedTo: null
    }
  ]
};

// Basic DSA Algorithm - Greedy Task Allocation
function allocateTasks(members, tasks) {
  // Reset workloads
  members.forEach(member => member.currentWorkload = 0);
  
  // Sort tasks by priority and deadline (Priority Queue concept)
  const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
  const sortedTasks = [...tasks].sort((a, b) => {
    // First sort by priority
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    // Then by deadline
    return new Date(a.deadline) - new Date(b.deadline);
  });

  const assignments = [];

  // Greedy allocation algorithm
  for (const task of sortedTasks) {
    let bestMember = null;
    let bestScore = -1;

    // Find best member for this task (HashMap-like skill lookup)
    for (const member of members) {
      // Check if member can take more work
      if (member.currentWorkload + task.estimatedHours > member.maxCapacity) {
        continue;
      }

      // Calculate match score
      const score = calculateMatchScore(member, task);
      
      if (score > bestScore) {
        bestScore = score;
        bestMember = member;
      }
    }

    // Assign task to best member
    if (bestMember && bestScore > 0) {
      assignments.push({
        taskId: task.id,
        taskTitle: task.title,
        memberId: bestMember.id,
        memberName: bestMember.name,
        matchScore: Math.round(bestScore),
        estimatedHours: task.estimatedHours
      });
      
      bestMember.currentWorkload += task.estimatedHours;
      task.assignedTo = bestMember.id;
    } else {
      // Task couldn't be assigned
      assignments.push({
        taskId: task.id,
        taskTitle: task.title,
        memberId: null,
        memberName: "Unassigned",
        matchScore: 0,
        estimatedHours: task.estimatedHours,
        reason: "No available member with required skills"
      });
    }
  }

  return assignments;
}

// Calculate how well a member matches a task
function calculateMatchScore(member, task) {
  let skillScore = 0;
  let skillCount = 0;

  // Check skill match (HashMap-like access)
  for (const requiredSkill of task.requiredSkills) {
    if (member.skillLevels[requiredSkill]) {
      skillScore += member.skillLevels[requiredSkill];
      skillCount++;
    }
  }

  // If member doesn't have any required skills, return 0
  if (skillCount === 0) return 0;

  // Average skill level for required skills
  const avgSkillLevel = skillScore / skillCount;

  // Workload penalty (prefer less loaded members)
  const workloadRatio = member.currentWorkload / member.maxCapacity;
  const workloadPenalty = workloadRatio * 20; // Max 20 point penalty

  // Final score (0-100 scale)
  const finalScore = avgSkillLevel * 10 - workloadPenalty;
  
  return Math.max(0, finalScore);
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Smart Task Allocator API is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/members', (req, res) => {
  res.json(teamData.members);
});

app.get('/api/tasks', (req, res) => {
  res.json(teamData.tasks);
});

app.post('/api/members', (req, res) => {
  const newMember = {
    id: Date.now(), // Simple ID generation
    currentWorkload: 0,
    ...req.body
  };
  teamData.members.push(newMember);
  res.json(newMember);
});

app.post('/api/tasks', (req, res) => {
  const newTask = {
    id: Date.now(),
    assignedTo: null,
    ...req.body
  };
  teamData.tasks.push(newTask);
  res.json(newTask);
});

app.post('/api/allocate', (req, res) => {
  try {
    const assignments = allocateTasks(teamData.members, teamData.tasks);
    
    // Calculate some stats
    const totalTasks = teamData.tasks.length;
    const assignedTasks = assignments.filter(a => a.memberId !== null).length;
    const avgMatchScore = assignments
      .filter(a => a.matchScore > 0)
      .reduce((sum, a) => sum + a.matchScore, 0) / assignedTasks || 0;

    res.json({
      assignments,
      stats: {
        totalTasks,
        assignedTasks,
        unassignedTasks: totalTasks - assignedTasks,
        avgMatchScore: Math.round(avgMatchScore),
        efficiency: Math.round((assignedTasks / totalTasks) * 100)
      },
      members: teamData.members.map(m => ({
        id: m.id,
        name: m.name,
        currentWorkload: m.currentWorkload,
        maxCapacity: m.maxCapacity,
        utilization: Math.round((m.currentWorkload / m.maxCapacity) * 100)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset assignments
app.post('/api/reset', (req, res) => {
  teamData.members.forEach(member => member.currentWorkload = 0);
  teamData.tasks.forEach(task => task.assignedTo = null);
  res.json({ message: 'All assignments reset successfully' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Test the API: http://localhost:${PORT}/api/health`);
});

module.exports = app;