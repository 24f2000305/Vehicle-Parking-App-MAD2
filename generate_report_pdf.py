"""Script to generate PDF report from markdown content."""

import os
from datetime import datetime

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, KeepTogether
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
except ImportError:
    print("Installing reportlab...")
    os.system("pip install reportlab")
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, KeepTogether
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY


def create_project_report():
    """Main function to create project report PDF."""
    filename = "PROJECT_REPORT.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4,
                           rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=18)
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading1_style = ParagraphStyle(
        'CustomHeading1',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#0d6efd'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#495057'),
        spaceAfter=10,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        alignment=TA_JUSTIFY,
        spaceAfter=12
    )
    
    # Title page
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("MAD-II Project Report", title_style))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("Vehicle Parking App V2", heading1_style))
    story.append(Spacer(1, 1*inch))
    
    # Student details table
    student_data = [
        ['Student Name:', '[Your Name]'],
        ['Roll Number:', '24f2000305'],
        ['Email:', '[Your Email]'],
        ['Course:', 'Modern Application Development II'],
        ['Term:', 'May 2025'],
        ['Submission Date:', datetime.now().strftime('%B %d, %Y')]
    ]
    
    student_table = Table(student_data, colWidths=[2*inch, 4*inch])
    student_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(student_table)
    story.append(PageBreak())
    
    # Section 1: Project Overview
    story.append(Paragraph("1. Project Overview", heading1_style))
    story.append(Paragraph(
        "I have developed a multi-user vehicle parking management application that efficiently manages "
        "4-wheeler parking slots. The system has two roles: Admin (Superuser) who can create, modify, "
        "and delete parking lots, and User who can browse available parking lots, book spots, and release "
        "them with automatic cost calculation based on parking duration.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    # Approach
    story.append(Paragraph("1.1 Approach to Solution", heading2_style))
    approach_points = [
        "Database Design: Designed database schema with proper relationships and foreign keys",
        "Backend API Development: Created RESTful APIs using Flask framework",
        "Frontend Development: Built single-page application using Vue.js",
        "Background Jobs: Implemented Celery for asynchronous operations",
        "Caching Strategy: Applied Redis caching for performance optimization",
        "Testing: Conducted comprehensive manual testing of all features"
    ]
    for point in approach_points:
        story.append(Paragraph(f"• {point}", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Section 2: Frameworks Used
    story.append(Paragraph("2. Frameworks and Libraries Used", heading1_style))
    
    tech_data = [
        ['Technology', 'Version', 'Purpose'],
        ['Flask', '2.3.3', 'Web framework for REST APIs'],
        ['Flask-Login', '0.6.3', 'Session-based authentication'],
        ['Flask-Caching', '2.1.0', 'Redis-backed caching'],
        ['Celery', '5.3.6', 'Background task processing'],
        ['Redis', '5.0.4', 'Cache store and message broker'],
        ['Vue.js', '3 (CDN)', 'Progressive JavaScript framework'],
        ['Bootstrap', '5.3.3', 'CSS framework'],
        ['SQLite', 'Built-in', 'Database'],
    ]
    
    tech_table = Table(tech_data, colWidths=[1.5*inch, 1*inch, 3.5*inch])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0d6efd')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Section 3: Database Schema
    story.append(Paragraph("3. Database Schema (ER Diagram)", heading1_style))
    story.append(Paragraph(
        "The database consists of 5 main tables with proper foreign key relationships:",
        body_style
    ))
    
    db_tables = [
        "<b>users</b> - Stores user authentication data and role management (admin/user)",
        "<b>parking_lots</b> - Contains parking lot details including pricing information",
        "<b>parking_spots</b> - Represents individual parking spaces with status (A=Available/O=Occupied)",
        "<b>reservations</b> - Records booking details with timestamps for cost calculation",
        "<b>export_jobs</b> - Tracks asynchronous export jobs for CSV generation"
    ]
    for table in db_tables:
        story.append(Paragraph(f"• {table}", body_style))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Key Relationships:", heading2_style))
    relationships = [
        "parking_spots.lot_id → parking_lots.id (Many-to-One)",
        "reservations.spot_id → parking_spots.id (Many-to-One)",
        "reservations.user_id → users.id (Many-to-One)",
        "export_jobs.user_id → users.id (Many-to-One)"
    ]
    for rel in relationships:
        story.append(Paragraph(f"• {rel}", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Section 4: API Endpoints
    story.append(Paragraph("4. API Resource Endpoints", heading1_style))
    story.append(Paragraph("Authentication APIs:", heading2_style))
    auth_apis = [
        "POST /api/auth/register - New user registration",
        "POST /api/auth/login - User login with session",
        "POST /api/auth/logout - User logout",
        "GET /api/auth/profile - Get current user details"
    ]
    for api in auth_apis:
        story.append(Paragraph(f"• {api}", body_style))
    
    story.append(Paragraph("Admin APIs:", heading2_style))
    admin_apis = [
        "GET /api/admin/lots - List all lots with availability",
        "POST /api/admin/lots - Create new parking lot",
        "PATCH /api/admin/lots/&lt;id&gt; - Update lot details",
        "DELETE /api/admin/lots/&lt;id&gt; - Delete empty lot",
        "GET /api/admin/users - List registered users",
        "GET /api/admin/reservations - List all reservations",
        "GET /api/admin/dashboard - Dashboard statistics with charts"
    ]
    for api in admin_apis:
        story.append(Paragraph(f"• {api}", body_style))
    
    story.append(Paragraph("User APIs:", heading2_style))
    user_apis = [
        "GET /api/user/lots - List available lots",
        "POST /api/user/reservations - Book parking spot",
        "POST /api/user/reservations/&lt;id&gt;/release - Release spot",
        "GET /api/user/exports - Request CSV export",
    ]
    for api in user_apis:
        story.append(Paragraph(f"• {api}", body_style))
    
    story.append(PageBreak())
    
    # Section 5: Key Features
    story.append(Paragraph("5. Key Features Implemented", heading1_style))
    
    features = [
        ("Authentication & Authorization", [
            "Session-based authentication using Flask-Login",
            "Role-based access control (admin vs user)",
            "Admin automatically created on database initialization",
            "Password hashing with Werkzeug"
        ]),
        ("Admin Functionality", [
            "Create/edit/delete parking lots",
            "Automatic spot generation when creating lots",
            "View dashboard statistics with visual charts",
            "View all registered users",
            "View all active and completed reservations",
            "Delete validation (prevents deleting occupied lots)"
        ]),
        ("User Functionality", [
            "Browse available lots with real-time availability",
            "Book parking spot (automatic first-available assignment)",
            "Release spot with automatic cost calculation",
            "View reservation history with visual charts",
            "Export booking history to CSV",
            "Real-time cost calculation based on parking duration"
        ]),
        ("Background Jobs", [
            "Daily Reminders at 18:00 (Celery beat scheduled task)",
            "Monthly Reports on 1st of month (HTML report generation)",
            "CSV Export (User-triggered async Celery task)",
            "All jobs tracked in database with status"
        ]),
        ("Performance Optimization", [
            "Redis caching on frequently accessed endpoints",
            "Cache expiry: Admin (300s), User lots (120s)",
            "Automatic cache busting on data modifications",
            "Efficient SQL queries with proper indexing"
        ])
    ]
    
    for feature_title, feature_list in features:
        story.append(Paragraph(f"5.{features.index((feature_title, feature_list)) + 1} {feature_title}", heading2_style))
        for item in feature_list:
            story.append(Paragraph(f"• {item}", body_style))
        story.append(Spacer(1, 0.1*inch))
    
    story.append(PageBreak())
    
    # Project Structure
    story.append(Paragraph("6. Project Structure", heading1_style))
    story.append(Paragraph(
        "The project follows a modular architecture with clear separation of concerns:",
        body_style
    ))
    
    structure_text = """
    <b>Backend Structure:</b><br/>
    • backend/app.py - Flask application factory and Celery configuration<br/>
    • backend/extensions.py - Flask-Login and Cache instances<br/>
    • backend/models/ - Database models and business logic<br/>
    • backend/routes/ - API endpoints (auth, admin, user)<br/>
    • backend/tasks.py - Celery background tasks<br/>
    <br/>
    <b>Frontend Structure:</b><br/>
    • frontend/index.html - Bootstrap shell and entry point<br/>
    • frontend/src/main.js - Vue application bootstrap<br/>
    • frontend/src/api.js - API fetch wrappers<br/>
    • frontend/src/components/ - Vue components (AuthPane, AdminPanel, UserPanel)<br/>
    """
    story.append(Paragraph(structure_text, body_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Section 7: Use of AI/LLM
    story.append(Paragraph("7. Use of AI/LLM", heading1_style))
    story.append(Paragraph(
        "I used GitHub Copilot in this project for code autocompletion, documentation suggestions, "
        "and identifying simple syntax errors. However, all core logic, architecture design, "
        "database schema, API structure, and business logic decisions were my own original work. "
        "AI assistance was limited to improving coding efficiency and identifying potential bugs.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    # Section 8: Challenges
    story.append(Paragraph("8. Challenges and Solutions", heading1_style))
    challenges = [
        ("Session Management with CORS", "Resolved CORS issues by adding credentials: 'include' in all fetch calls and proper Flask session configuration"),
        ("Concurrent Spot Allocation", "Fixed race condition using SQL transaction with immediate status update to prevent double booking"),
        ("Celery Flask Context", "Created custom ContextTask class to provide Flask application context in background jobs"),
        ("Cache Invalidation Strategy", "Implemented centralized cache keys with automatic cache busting on data modifications")
    ]
    for challenge, solution in challenges:
        story.append(Paragraph(f"<b>{challenge}:</b> {solution}", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Section 9: Conclusion
    story.append(Paragraph("9. Conclusion", heading1_style))
    story.append(Paragraph(
        "I have successfully developed a fully functional parking management application that meets all "
        "core MAD-II requirements including: two-role system with RBAC, session-based authentication using Flask-Login, "
        "comprehensive RESTful APIs, admin lot management with CRUD operations, user booking system with automatic "
        "spot allocation, cost calculation based on parking duration, Redis caching for performance optimization, "
        "Celery background jobs for scheduled tasks (daily reminders and monthly reports), and CSV export functionality. "
        "The code is well-structured and maintainable with clear separation of concerns. Visual charts have been "
        "implemented using Chart.js for both admin and user dashboards. The admin panel includes a detailed reservation "
        "view showing all active and completed bookings.",
        body_style
    ))
    story.append(Spacer(1, 0.3*inch))
    
    # Section 10: Video Link
    story.append(Paragraph("10. Video Presentation", heading1_style))
    story.append(Paragraph(
        "The project demonstration video (approximately 3 minutes) is available here:",
        body_style
    ))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(
        "<b>Video Link:</b> [https://drive.google.com/your-video-link]",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph(
        "<b>Video Contents:</b>",
        body_style
    ))
    video_contents = [
        "Introduction and project overview (30 seconds)",
        "Approach to problem statement (30 seconds)",
        "Key features demonstration (90 seconds)",
        "Additional features and enhancements (30 seconds)"
    ]
    for content in video_contents:
        story.append(Paragraph(f"• {content}", body_style))
    story.append(Spacer(1, 0.5*inch))
    
    # Declaration
    story.append(Paragraph(
        "<b>Declaration:</b> I hereby declare that this project is my own work and the code has been "
        "written by me with assistance from AI tools as mentioned in Section 7. All references and "
        "resources used have been properly cited. The implementation follows best practices and "
        "adheres to the project requirements specified in the MAD-II course.",
        body_style
    ))
    story.append(Spacer(1, 0.3*inch))
    
    # References
    story.append(Paragraph("11. References", heading1_style))
    references = [
        "Flask Documentation - https://flask.palletsprojects.com/",
        "Vue.js Documentation - https://vuejs.org/",
        "Celery Documentation - https://docs.celeryproject.org/",
        "Flask-Login Documentation - https://flask-login.readthedocs.io/",
        "Bootstrap Documentation - https://getbootstrap.com/",
        "Chart.js Documentation - https://www.chartjs.org/",
        "Redis Documentation - https://redis.io/documentation"
    ]
    for ref in references:
        story.append(Paragraph(f"• {ref}", body_style))
    story.append(Spacer(1, 0.5*inch))
    
    signature_data = [
        ['Signature: ________________', 'Date: ________________']
    ]
    sig_table = Table(signature_data, colWidths=[3*inch, 3*inch])
    story.append(sig_table)
    
    # Build PDF
    doc.build(story)
    print(f"PDF report generated successfully: {filename}")
    return filename


if __name__ == "__main__":
    create_project_report()
