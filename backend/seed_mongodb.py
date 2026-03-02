#!/usr/bin/env python3
"""
Seed MongoDB with sample courses, topics, assignments, and components
for testing the application with real data.
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongodb import (
    create_course,
    get_topics,
    add_topic,
    get_components,
    replace_components,
    create_assignment,
    list_courses,
)

# Load environment variables
load_dotenv()

# Sample courses to seed
SAMPLE_COURSES = [
    {
        "code": "CS301",
        "name": "Data Structures & Algorithms",
        "term": "Y2S2"
    },
    {
        "code": "CS302",
        "name": "Database Systems",
        "term": "Y2S2"
    },
    {
        "code": "MA201",
        "name": "Linear Algebra",
        "term": "Y2S2"
    },
]

# Sample topics for each course
SAMPLE_TOPICS = {
    "CS301": [
        ("Arrays & Linked Lists", 0, None),
        ("Stacks & Queues", 1, None),
        ("Hash Tables", 2, None),
        ("Trees & BST", 3, None),
        ("Heaps & Priority Queues", 4, None),
        ("Graph Fundamentals", 5, None),
        ("Graph Traversals (BFS/DFS)", 6, None),
        ("Shortest Path Algorithms", 7, None),
    ],
    "CS302": [
        ("Database Design Fundamentals", 0, None),
        ("SQL Basics", 1, None),
        ("Normalization", 2, None),
        ("Transactions & Concurrency", 3, None),
        ("Indexing & Query Optimization", 4, None),
        ("NoSQL Databases", 5, None),
    ],
    "MA201": [
        ("Vectors & Vector Spaces", 0, None),
        ("Matrix Operations", 1, None),
        ("Determinants & Inverses", 2, None),
        ("Eigenvalues & Eigenvectors", 3, None),
        ("Diagonalization", 4, None),
        ("Linear Transformations", 5, None),
    ],
}

# Sample components for each course
SAMPLE_COMPONENTS = {
    "CS301": [
        ("Quizzes", 0.30),
        ("Midterm Exam", 0.25),
        ("Final Exam", 0.35),
        ("Labs & Assignments", 0.10),
    ],
    "CS302": [
        ("Midterm Exam", 0.30),
        ("Final Exam", 0.40),
        ("Project", 0.20),
        ("Participation", 0.10),
    ],
    "MA201": [
        ("Quizzes", 0.20),
        ("Midterm Exam", 0.30),
        ("Final Exam", 0.40),
        ("Problem Sets", 0.10),
    ],
}

# Sample assignments for each course
SAMPLE_ASSIGNMENTS = {
    "CS301": [
        {
            "title": "Array Implementation",
            "description": "Implement basic array operations",
            "due_days": 14,
            "weight": 0.05,
        },
        {
            "title": "BST Operations",
            "description": "Implement binary search tree with insert, delete, search",
            "due_days": 28,
            "weight": 0.05,
        },
        {
            "title": "Graph Problem Set",
            "description": "Solve graph traversal and shortest path problems",
            "due_days": 42,
            "weight": 0.05,
        },
    ],
    "CS302": [
        {
            "title": "Database Design Project",
            "description": "Design and implement a relational database",
            "due_days": 21,
            "weight": 0.20,
        },
        {
            "title": "SQL Query Optimization",
            "description": "Optimize slow queries using indexes",
            "due_days": 35,
            "weight": 0.10,
        },
    ],
    "MA201": [
        {
            "title": "Matrix Problem Set 1",
            "description": "Solve matrix operations problems",
            "due_days": 10,
            "weight": 0.05,
        },
        {
            "title": "Eigenvalues Assignment",
            "description": "Find eigenvalues and eigenvectors",
            "due_days": 24,
            "weight": 0.05,
        },
    ],
}


def seed_database():
    """Seed MongoDB with sample data"""
    print("Starting MongoDB seed...")
    
    try:
        # Check existing courses
        existing = list_courses()
        if existing:
            print(f"Database already contains {len(existing)} courses. Skipping seed.")
            return
        
        # Create courses
        print("\n🎓 Creating courses...")
        for course_data in SAMPLE_COURSES:
            course = create_course(
                code=course_data["code"],
                name=course_data["name"],
                term=course_data["term"]
            )
            print(f"✓ Created: {course['code']} - {course['name']}")
            
            # Add topics for this course
            code = course["code"]
            if code in SAMPLE_TOPICS:
                print(f"  Adding topics for {code}...")
                for title, order_idx, parent_id in SAMPLE_TOPICS[code]:
                    topic = add_topic(code, parent_id, title, order_idx)
                    print(f"  ✓ Topic: {title}")
            
            # Add components for this course
            if code in SAMPLE_COMPONENTS:
                print(f"  Adding components for {code}...")
                components = SAMPLE_COMPONENTS[code]
                replace_components(code, components)
                for name, weight in components:
                    print(f"  ✓ Component: {name} ({weight*100}%)")
            
            # Add assignments for this course
            if code in SAMPLE_ASSIGNMENTS:
                print(f"  Adding assignments for {code}...")
                for assign_data in SAMPLE_ASSIGNMENTS[code]:
                    due_date = datetime.utcnow() + timedelta(days=assign_data["due_days"])
                    assignment = create_assignment(
                        course_code=code,
                        title=assign_data["title"],
                        description=assign_data["description"],
                        due_at=due_date,
                        weight=assign_data["weight"]
                    )
                    print(f"  ✓ Assignment: {assignment['title']} (due in {assign_data['due_days']} days)")
        
        print("\n✅ Database seeding completed successfully!")
        
        # Show summary
        courses = list_courses()
        print(f"\n📊 Summary:")
        print(f"  Total courses: {len(courses)}")
        for course in courses:
            topics = get_topics(course["code"])
            components = get_components(course["code"])
            print(f"  - {course['code']}: {len(topics)} topics, {len(components)} components")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    seed_database()
