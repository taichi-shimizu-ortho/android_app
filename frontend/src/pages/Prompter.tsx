import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Prompter.css';

const sections = [
    { title: "Introduction", duration: 50, text: "I am Taichi Shimizu from Japan. \n\nMy talk is focusing more about \"Relaxin Family Peptide receptor 1 Expression in the Murine Hip Joint.\"\n\nRelaxin is a peptide hormone that binds to relaxin family peptide receptor 1 (RXFP1) and induces ligament relaxation through the production of matrix metalloproteinases (MMP-3).\n\nHowever, recent literature lacks a clear understanding of RXFP1 expression in the normal hip joint.\n\nTherefore, The purpose of this study are: To examine sex and pregnancy-related variations of RXFP1 in the hip joint, and to investigate the relationship between chondrocyte differentiation and RXFP1 expression." },
    { title: "Methods", duration: 43, text: "Male and female 8-week-old mice and mice at 18 days of gestation were used. Histological assessment was performed using Hematoxylin eosin and masson trichrome staining. RXFP1 expression was assessed by RT-PCR. Immunohistochemistry was performed using antibodies against RXFP1 and SOX9 (SRY-box transcription factor 9).\n\nIn experiments using cultured cells, ATDC5 cells were induced to differentiate using ITS as a chondrogenic inducer. The expression of RXFP1 and SOX9 was examined by Western blotting." },
    { title: "Results", duration: 30, text: "The left top panel shows histological evaluation that revealed no obvious morphological differences between males and females. The right top panel shows immunohistochemical analysis that detected RXFP1 expression in the joint capsule and articular cartilage. In addition, on the left bottom panel, double immunostaining revealed that RXFP1 colocalized with the chondrocyte marker SOX9.\n\nWestern blot analysis showed that both RXFP1 and SOX9 increased with chondrogenic differentiation." },
    { title: "Conclusion", duration: 15, text: "RXFP1 expression is localized in the articular cartilage and joint capsule.\n\nRXFP1 expression is upregulated according to chondrocyte differentiation. Thank you for your attention." }
];

export default function Prompter() {
    const [currentSection, setCurrentSection] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(sections[0].duration);
    const [overallElapsed, setOverallElapsed] = useState(0);
    const [presentationActive, setPresentationActive] = useState(false);
    
    const timerRef = useRef<number | null>(null);
    const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);

    useEffect(() => {
        if (presentationActive) {
            timerRef.current = window.setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        if (currentSection < sections.length - 1) {
                            setCurrentSection(c => c + 1);
                            window.scrollTo(0, 0);
                            return sections[currentSection + 1].duration;
                        } else {
                            if (timerRef.current) clearInterval(timerRef.current);
                            setPresentationActive(false);
                            alert("Presentation Finished!");
                            return 0;
                        }
                    }
                    return prev - 1;
                });
                setOverallElapsed(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [presentationActive, currentSection]);

    // Handle swipe
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.changedTouches[0].screenX;
        touchStartY.current = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX.current;
        const diffY = touchEndY - touchStartY.current;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                handlePrev();
            } else {
                handleNext();
            }
        }
    };

    const togglePresentation = () => {
        setPresentationActive(!presentationActive);
    };

    const handleNext = () => {
        if (currentSection < sections.length - 1) {
            setCurrentSection(prev => prev + 1);
            setTimeRemaining(sections[currentSection + 1].duration);
            window.scrollTo(0, 0);
        }
    };

    const handlePrev = () => {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1);
            setTimeRemaining(sections[currentSection - 1].duration);
            window.scrollTo(0, 0);
        }
    };

    const section = sections[currentSection];
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    const oMins = Math.floor(overallElapsed / 60);
    const oSecs = overallElapsed % 60;
    const progress = Math.min((overallElapsed / totalDuration) * 100, 100);

    return (
        <div className="prompter-wrapper" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="timer-bar" style={{ width: `${progress}%` }}></div>
            
            <div className="header-info">
                <Link to="/" className="back-to-home-prompter">🏠 ホームへ戻る</Link>
                <div className="section-counter">{currentSection + 1} / {sections.length}</div>
                <div className="total-timer">Total: {oMins}:{String(oSecs).padStart(2, '0')}</div>
                <div className="timer-display">{mins}:{String(secs).padStart(2, '0')}</div>
            </div>

            <div className="prompter-container">
                <div className="prompter-content">
                    <div className="section-title">{section.title}</div>
                    <div className="section-text">{section.text}</div>
                </div>
            </div>

            <div className="prompter-controls">
                <button className="btn-prev" onClick={() => handlePrev()}>← PREV</button>
                <button className="btn-start" onClick={togglePresentation}>
                    {presentationActive ? 'PAUSE' : 'START'}
                </button>
                <button className="btn-next" onClick={() => handleNext()}>NEXT →</button>
            </div>
        </div>
    );
}
