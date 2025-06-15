import { useState, useEffect } from 'react'
import './App.css'
import cyberLearLogo from './assets/CyberLear-Logo.png'

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when a link is clicked
  const handleMobileNavClick = (section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  // Handle scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'services', 'systems', 'about', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <nav className="navbar">
            <div className="logo">
              <img src={cyberLearLogo} alt="Lear Cyber Tech Logo" />
            </div>
            <ul className="nav-links">
              <li><a href="#home" onClick={() => setActiveSection('home')} className={activeSection === 'home' ? 'active' : ''}>Home</a></li>
              <li><a href="#services" onClick={() => setActiveSection('services')} className={activeSection === 'services' ? 'active' : ''}>Services</a></li>
              <li><a href="#systems" onClick={() => setActiveSection('systems')} className={activeSection === 'systems' ? 'active' : ''}>Systems</a></li>
              <li><a href="#about" onClick={() => setActiveSection('about')} className={activeSection === 'about' ? 'active' : ''}>About</a></li>
              <li><a href="#contact" onClick={() => setActiveSection('contact')} className={activeSection === 'contact' ? 'active' : ''}>Contact</a></li>
            </ul>
            <div className="mobile-menu-btn" onClick={toggleMobileMenu}>
              <span className={mobileMenuOpen ? 'open' : ''}></span>
              <span className={mobileMenuOpen ? 'open' : ''}></span>
              <span className={mobileMenuOpen ? 'open' : ''}></span>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
        <ul className="mobile-nav-links">
          <li><a href="#home" onClick={() => handleMobileNavClick('home')} className={activeSection === 'home' ? 'active' : ''}>Home</a></li>
          <li><a href="#services" onClick={() => handleMobileNavClick('services')} className={activeSection === 'services' ? 'active' : ''}>Services</a></li>
          <li><a href="#systems" onClick={() => handleMobileNavClick('systems')} className={activeSection === 'systems' ? 'active' : ''}>Systems</a></li>
          <li><a href="#about" onClick={() => handleMobileNavClick('about')} className={activeSection === 'about' ? 'active' : ''}>About</a></li>
          <li><a href="#contact" onClick={() => handleMobileNavClick('contact')} className={activeSection === 'contact' ? 'active' : ''}>Contact</a></li>
        </ul>
      </div>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Securing the Digital Future</h1>
            <p>Innovative zero-cost automated systems that work while you sleep</p>
            <div className="hero-buttons">
              <a href="#systems" className="btn btn-primary">Explore Systems</a>
              <a href="#contact" className="btn btn-outline">Contact Us</a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="section services-section">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">Comprehensive cybersecurity and digital transformation solutions</p>
          
          <div className="services-grid">
            <div className="service-card card">
              <div className="service-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Cyber Risk Services</h3>
              <p>Comprehensive risk assessment and management solutions to protect your digital assets.</p>
            </div>
            
            <div className="service-card card">
              <div className="service-icon">
                <i className="fas fa-digital-tachograph"></i>
              </div>
              <h3>Digital Transformation</h3>
              <p>Strategic guidance and implementation for your organization's digital journey.</p>
            </div>
            
            <div className="service-card card">
              <div className="service-icon">
                <i className="fas fa-lock"></i>
              </div>
              <h3>OT/IT Cyber Security</h3>
              <p>Specialized security solutions for operational technology and information systems.</p>
            </div>
            
            <div className="service-card card">
              <div className="service-icon">
                <i className="fas fa-cogs"></i>
              </div>
              <h3>Managed Services</h3>
              <p>Continuous monitoring and management of your security infrastructure.</p>
            </div>
            
            <div className="service-card card">
              <div className="service-icon">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <h3>Compliances</h3>
              <p>Ensure adherence to GDPR, HIPAA, ISO, NIST, and CSF standards.</p>
            </div>
            
            <div className="service-card card">
              <div className="service-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Data Analytics</h3>
              <p>Transform raw data into actionable security intelligence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Systems Section */}
      <section id="systems" className="section systems-section">
        <div className="container">
          <h2 className="section-title">Zero-Cost Automated Systems</h2>
          <p className="section-subtitle">Passive income solutions that run 24/7 with no investment required</p>
          
          <div className="systems-grid">
            <div className="system-card card">
              <h3>Security Compliance Documentation Generator</h3>
              <p className="system-tag">Top Recommended</p>
              <p>Automatically generate compliance documentation templates for various standards (GDPR, HIPAA, ISO, NIST).</p>
              <ul className="system-features">
                <li>Template library for compliance documents</li>
                <li>Customization through simple questionnaires</li>
                <li>Automated document generation</li>
                <li>Regular updates to match changing regulations</li>
              </ul>
              <a href="#contact" className="btn btn-outline">Learn More</a>
            </div>
            
            <div className="system-card card">
              <h3>Cybersecurity Assessment Tool</h3>
              <p>Self-service web application for businesses to assess their cybersecurity posture against frameworks.</p>
              <ul className="system-features">
                <li>Framework-based assessment questionnaires</li>
                <li>Automated scoring and recommendations</li>
                <li>Downloadable reports with actionable insights</li>
                <li>Industry-specific security guidance</li>
              </ul>
              <a href="#contact" className="btn btn-outline">Learn More</a>
            </div>
            
            <div className="system-card card">
              <h3>Vulnerability News Aggregator</h3>
              <p>Automated platform that aggregates, categorizes, and alerts on the latest cybersecurity vulnerabilities.</p>
              <ul className="system-features">
                <li>Real-time vulnerability database integration</li>
                <li>Industry and technology categorization</li>
                <li>Customized alerts and digests</li>
                <li>Severity assessment and prioritization</li>
              </ul>
              <a href="#contact" className="btn btn-outline">Learn More</a>
            </div>
          </div>
          
          <div className="systems-cta">
            <p>Discover how these zero-cost systems can generate passive income while enhancing your cybersecurity posture.</p>
            <a href="#contact" className="btn btn-primary">Get Started Today</a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section about-section">
        <div className="container">
          <h2 className="section-title">About Lear Cyber Tech</h2>
          <div className="about-content">
            <div className="about-text">
              <h3>Our Vision</h3>
              <p>To be the leading global cybersecurity solutions provider, empowering organizations to navigate the complex digital landscape with confidence and resilience.</p>
              
              <h3>Our Mission</h3>
              <p>To protect critical infrastructure and sensitive data by delivering innovative IT/OT cyber risk and digital transformation services.</p>
              
              <h3>Our Values</h3>
              <ul className="values-list">
                <li><strong>Integrity:</strong> Upholding the highest ethical standards in all our endeavors.</li>
                <li><strong>Customer Focus:</strong> Prioritizing client needs and delivering value-driven solutions.</li>
                <li><strong>Innovation:</strong> Embracing new technologies and approaches to stay ahead of the curve.</li>
                <li><strong>Teamwork:</strong> Fostering a collaborative and supportive work environment.</li>
                <li><strong>Excellence:</strong> Striving for perfection in all aspects of our work.</li>
              </ul>
            </div>
            
            <div className="about-founder">
              <h3>Our Founder</h3>
              <div className="founder-info">
                <h4>Dr. Libin Pallikunnel Kurian</h4>
                <p>Cybersecurity expert and digital transformation specialist with extensive experience in securing critical infrastructure and implementing innovative security solutions.</p>
                <a href="https://www.linkedin.com/in/dr-libin-pallikunnel-kurian-88741530/" target="_blank" rel="noopener noreferrer" className="btn btn-outline">View LinkedIn Profile</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section contact-section">
        <div className="container">
          <h2 className="section-title">Contact Us</h2>
          <p className="section-subtitle">Get in touch to learn more about our zero-cost automated systems</p>
          
          <div className="contact-grid">
            <div className="contact-form">
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" name="name" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input type="text" id="subject" name="subject" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows={5} required></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            </div>
            
            <div className="contact-info">
              <div className="contact-method">
                <h3>Email</h3>
                <a href="mailto:libinpkurian@gmail.com">libinpkurian@gmail.com</a>
              </div>
              
              <div className="contact-method">
                <h3>WhatsApp</h3>
                <a href="https://wa.me/919946131162" target="_blank" rel="noopener noreferrer">+91 9946 131 162</a>
              </div>
              
              <div className="contact-method">
                <h3>Company</h3>
                <a href="https://www.linkedin.com/company/leartech" target="_blank" rel="noopener noreferrer">Lear Cyber Tech on LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src={cyberLearLogo} alt="Lear Cyber Tech Logo" />
              <p>Securing the Digital Future</p>
            </div>
            
            <div className="footer-links">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#systems">Systems</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            
            <div className="footer-services">
              <h3>Our Services</h3>
              <ul>
                <li>Cyber Risk Services</li>
                <li>Digital Transformation</li>
                <li>OT/IT Cyber Security</li>
                <li>Managed Services</li>
                <li>Compliances</li>
                <li>Data Analytics</li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Lear Cyber Tech. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Social Sidebar */}
      <div className="social-sidebar">
        <a href="https://www.linkedin.com/company/leartech" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn">
          <i className="fab fa-linkedin"></i>
        </a>
        <a href="https://wa.me/919946131162" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="WhatsApp">
          <i className="fab fa-whatsapp"></i>
        </a>
        <a href="mailto:libinpkurian@gmail.com" className="social-icon" aria-label="Email">
          <i className="fas fa-envelope"></i>
        </a>
      </div>
    </div>
  )
}

export default App
