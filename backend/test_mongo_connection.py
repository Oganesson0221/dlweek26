#!/usr/bin/env python3
"""Quick test script to verify MongoDB connection"""
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.mongodb import list_courses, list_assignments, get_components, get_topics

load_dotenv()

print("📚 Verifying MongoDB Connection...\n")
print("=" * 60)

try:
    courses = list_courses()
    print(f"✅ Successfully connected to MongoDB!")
    print(f"\n📊 Database Contents:\n")
    
    if not courses:
        print("No courses found. Run seed_mongodb.py to populate the database.")
    else:
        for i, course in enumerate(courses, 1):
            print(f"{i}. {course['code']} - {course['name']}")
            
            topics = get_topics(course['code'])
            components = get_components(course['code'])
            assignments = list_assignments(course['code'])
            
            print(f"   ├─ Topics: {len(topics)}")
            if topics:
                for topic in topics[:3]:
                    print(f"   │  ├─ {topic['title']}")
                if len(topics) > 3:
                    print(f"   │  └─ ... and {len(topics)-3} more")
            
            print(f"   ├─ Components: {len(components)}")
            if components:
                for comp in components[:2]:
                    print(f"   │  ├─ {comp['name']} ({comp['weight']*100}%)")
                if len(components) > 2:
                    print(f"   │  └─ ... and {len(components)-2} more")
            
            print(f"   └─ Assignments: {len(assignments)}")
            if assignments:
                for assign in assignments[:2]:
                    print(f"      ├─ {assign['title']}")
                if len(assignments) > 2:
                    print(f"      └─ ... and {len(assignments)-2} more")
            print()
    
    print("=" * 60)
    print("✅ MongoDB Connection Test Passed!")
    
except Exception as e:
    print(f"❌ MongoDB Connection Failed!")
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
