document.addEventListener("DOMContentLoaded", () => {

    // --- Preloader Boot Sequence ---
    const preloader = document.getElementById('preloader');
    const bootText = document.getElementById('boot-text');
    
    // Pause hero animations initially so they don't play under the overlay
    const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-actions, .hero-links');
    heroElements.forEach(el => {
        el.style.animationPlayState = 'paused';
    });

    if (preloader && bootText) {
        const bootMessages = [
            "INIT: version 2.88 booting",
            "[ OK ] Starting system message bus...",
            "[ OK ] Started Login Service.",
            "[ OK ] Started mm.ai Core Systems.",
            "Mounting /portfolio/experience... done.",
            "Loading skills manifest... [ OK ]",
            "Initializing Agentic AI modules... success.",
            "Establishing connection to port 3000...",
            "Decrypting user payload... verified.",
            "Welcome to mm.ai workspace."
        ];
        
        let msgIndex = 0;
        
        function showNextMessage() {
            if (msgIndex < bootMessages.length) {
                const msg = document.createElement('div');
                msg.textContent = bootMessages[msgIndex];
                bootText.appendChild(msg);
                msgIndex++;
                
                // Randomly stagger log generation speed to simulate real IO parsing
                setTimeout(showNextMessage, Math.random() * 120 + 30);
            } else {
                // Done loading
                setTimeout(() => {
                    preloader.classList.add('fade-out');
                    setTimeout(() => {
                        preloader.style.display = 'none';
                        // Resume hero animations
                        heroElements.forEach(el => {
                            el.style.animationPlayState = 'running';
                        });
                    }, 500);
                }, 800);
            }
        }

        setTimeout(showNextMessage, 300);
    }

    // --- Cards Fade-in & Terminal Scroll Handlers ---
    const fadeElements = document.querySelectorAll('.card, .skill-category, .publication-item');
    fadeElements.forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${(index % 3) * 0.15 + (Math.random() * 0.1)}s`;
    });

    const typeElements = document.querySelectorAll('.section-header h2, .cta-title');
    typeElements.forEach(el => {
        el.dataset.text = el.innerText;
        el.innerHTML = '<span class="cursor">_</span>';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('fade-in')) {
                    entry.target.classList.add('visible');
                }
                
                if (entry.target.hasAttribute('data-text') && !entry.target.classList.contains('typed')) {
                    entry.target.classList.add('typed');
                    typeOutText(entry.target);
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    fadeElements.forEach(el => observer.observe(el));
    typeElements.forEach(el => observer.observe(el));

    function typeOutText(element) {
        const fullText = element.dataset.text;
        element.innerHTML = ''; 
        let i = 0;
        
        function type() {
            if (i < fullText.length) {
                element.innerHTML = element.innerHTML.replace('<span class="cursor">_</span>', '');
                element.innerHTML += fullText.charAt(i);
                i++;
                element.innerHTML += '<span class="cursor">_</span>';
                
                setTimeout(type, Math.random() * 40 + 20);
            } else {
                setTimeout(() => {
                    element.innerHTML = element.innerHTML.replace('<span class="cursor">_</span>', '');
                }, 1500);
            }
        }
        setTimeout(type, 100);
    }

    // --- Matrix Rain Background ---
    const canvas = document.getElementById('matrix-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Clean binary and hex characters for a subtle, attractive AI theme
        const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/-=*';
        const fontSize = 14;
        let columns = Math.ceil(canvas.width / fontSize);
        let drops = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        function drawMatrix() {
            // Smooth soft fade for a gentler rain effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = fontSize + 'px "Fira Code", monospace';
            
            for (let i = 0; i < drops.length; i++) {
                // Return to a soft, consistent translucent green for subtle elegance
                ctx.fillStyle = 'rgba(57, 255, 20, 0.5)'; 
                
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                // Reset drops slightly less aggressively than before
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.985) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }
        
        // Return to moderate speed
        setInterval(drawMatrix, 45);

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            columns = Math.ceil(canvas.width / fontSize);
            
            if (columns > drops.length) {
                for (let x = drops.length; x < columns; x++) {
                    drops[x] = 1;
                }
            }
        });
    }
});
