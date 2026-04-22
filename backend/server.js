// backend/server.js - Complete version with DSA algorithms
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Sample data - simulating a database
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
    },
    {
      id: 4,
      title: "Implement User Authentication",
      description: "JWT-based authentication system",
      requiredSkills: ["Node.js", "JavaScript"],
      estimatedHours: 15,
      priority: "high",
      deadline: "2025-08-08",
      assignedTo: null
    }
  ]
};

// DSA ALGORITHMS IMPLEMENTATION

// Priority Queue implementation for task sorting
function prioritizeTask(a, b) {
  const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
  
  // First sort by priority (higher priority first)
  if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  }
  
  // Then by deadline (earlier deadline first)
  return new Date(a.deadline) - new Date(b.deadline);
}

// HashMap-based skill matching function
function calculateMatchScore(member, task) {
  let skillScore = 0;
  let skillCount = 0;

  // Check skill match using HashMap concept (JavaScript object)
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

  // Deadline urgency boost
  const daysUntilDeadline = Math.max(1, 
    (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const urgencyBoost = Math.min(10, 10 / daysUntilDeadline); // Max 10 point boost

  // Final score calculation
  const finalScore = avgSkillLevel * 10 - workloadPenalty + urgencyBoost;
  
  return Math.max(0, finalScore);
}

// Main Greedy Algorithm for Task Allocation
function allocateTasks(members, tasks) {
  // Reset all workloads
  members.forEach(member => member.currentWorkload = 0);
  tasks.forEach(task => task.assignedTo = null);
  
  // Step 1: Sort tasks using Priority Queue concept
  const sortedTasks = [...tasks].sort(prioritizeTask);
  
  const assignments = [];
  const unassignedTasks = [];

  // Step 2: Greedy allocation - assign each task to best available member
  for (const task of sortedTasks) {
    let bestMember = null;
    let bestScore = -1;

    // Find best member for this task
    for (const member of members) {
      // Check capacity constraint
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

    // Assign task to best member or mark as unassigned
    if (bestMember && bestScore > 0) {
      assignments.push({
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
        memberId: bestMember.id,
        memberName: bestMember.name,
        matchScore: Math.round(bestScore),
        estimatedHours: task.estimatedHours,
        priority: task.priority,
        deadline: task.deadline,
        requiredSkills: task.requiredSkills,
        status: 'assigned'
      });
      
      // Update member workload
      bestMember.currentWorkload += task.estimatedHours;
      task.assignedTo = bestMember.id;
    } else {
      unassignedTasks.push({
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
        memberId: null,
        memberName: "Unassigned",
        matchScore: 0,
        estimatedHours: task.estimatedHours,
        priority: task.priority,
        deadline: task.deadline,
        requiredSkills: task.requiredSkills,
        status: 'unassigned',
        reason: bestScore === -1 ? "No available member with required skills" : "All suitable members at capacity"
      });
    }
  }

  return { assignments, unassignedTasks };
}

// API ROUTES

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Smart Task Allocator API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/members', (req, res) => {
  res.json({
    success: true,
    data: teamData.members,
    count: teamData.members.length
  });
});

app.get('/api/tasks', (req, res) => {
  res.json({
    success: true,
    data: teamData.tasks,
    count: teamData.tasks.length
  });
});

app.post('/api/members', (req, res) => {
  try {
    const { name, skills, skillLevels, maxCapacity } = req.body;
    
    if (!name || !skills || !skillLevels || !maxCapacity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, skills, skillLevels, maxCapacity'
      });
    }

    const newMember = {
      id: Date.now(),
      name,
      skills,
      skillLevels,
      maxCapacity,
      currentWorkload: 0
    };
    
    teamData.members.push(newMember);
    
    res.json({
      success: true,
      data: newMember,
      message: 'Member added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { title, description, requiredSkills, estimatedHours, priority, deadline } = req.body;
    
    if (!title || !requiredSkills || !estimatedHours || !priority || !deadline) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, requiredSkills, estimatedHours, priority, deadline'
      });
    }

    const newTask = {
      id: Date.now(),
      title,
      description: description || '',
      requiredSkills,
      estimatedHours,
      priority,
      deadline,
      assignedTo: null
    };
    
    teamData.tasks.push(newTask);
    
    res.json({
      success: true,
      data: newTask,
      message: 'Task added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Main allocation endpoint - runs the DSA algorithms
app.post('/api/allocate', (req, res) => {
  try {
    const result = allocateTasks(teamData.members, teamData.tasks);
    
    // Calculate statistics
    const totalTasks = teamData.tasks.length;
    const assignedTasks = result.assignments.length;
    const unassignedTasks = result.unassignedTasks.length;
    
    const avgMatchScore = result.assignments.length > 0 
      ? result.assignments.reduce((sum, a) => sum + a.matchScore, 0) / result.assignments.length 
      : 0;

    // Calculate member utilization
    const memberStats = teamData.members.map(member => ({
      id: member.id,
      name: member.name,
      currentWorkload: member.currentWorkload,
      maxCapacity: member.maxCapacity,
      utilization: Math.round((member.currentWorkload / member.maxCapacity) * 100),
      availableHours: member.maxCapacity - member.currentWorkload
    }));

    res.json({
      success: true,
      data: {
        assignments: result.assignments,
        unassignedTasks: result.unassignedTasks,
        statistics: {
          totalTasks,
          assignedTasks,
          unassignedTasks,
          assignmentRate: Math.round((assignedTasks / totalTasks) * 100),
          avgMatchScore: Math.round(avgMatchScore),
          totalEstimatedHours: teamData.tasks.reduce((sum, task) => sum + task.estimatedHours, 0),
          allocatedHours: result.assignments.reduce((sum, a) => sum + a.estimatedHours, 0)
        },
        memberStats
      },
      message: 'Task allocation completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reset all assignments
app.post('/api/reset', (req, res) => {
  teamData.members.forEach(member => member.currentWorkload = 0);
  teamData.tasks.forEach(task => task.assignedTo = null);
  
  res.json({
    success: true,
    message: 'All assignments have been reset successfully'
  });
});

// Get algorithm info for documentation
app.get('/api/algorithms', (req, res) => {
  res.json({
    success: true,
    data: {
      algorithms: [
        {
          name: "Priority Queue",
          description: "Tasks are sorted by priority (high > medium > low) and then by deadline",
          timeComplexity: "O(n log n)",
          spaceComplexity: "O(n)"
        },
        {
          name: "HashMap (Skill Matching)",
          description: "Fast O(1) lookup for member skills and skill levels",
          timeComplexity: "O(1) per lookup",
          spaceComplexity: "O(k) where k is number of skills"
        },
        {
          name: "Greedy Algorithm",
          description: "Assigns each task to the best available member based on match score",
          timeComplexity: "O(n * m) where n=tasks, m=members",
          spaceComplexity: "O(n + m)"
        },
        {
          name: "Multi-criteria Optimization",
          description: "Match score considers skill level, workload balance, and deadline urgency",
          timeComplexity: "O(k) per calculation where k=required skills",
          spaceComplexity: "O(1)"
        }
      ],
      overallComplexity: {
        time: "O(n log n + n * m * k)",
        space: "O(n + m + k)",
        description: "n=tasks, m=members, k=avg skills per task"
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Test the API: http://localhost:${PORT}/api/health`);
  console.log(`🔍 View algorithms: http://localhost:${PORT}/api/algorithms`);
  console.log(`👥 Members: http://localhost:${PORT}/api/members`);
  console.log(`📋 Tasks: http://localhost:${PORT}/api/tasks`);
});

module.exports = app;