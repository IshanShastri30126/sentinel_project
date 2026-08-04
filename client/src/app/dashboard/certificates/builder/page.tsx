"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, apiUpload, getFileUrl } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Save, Upload, Layout, Settings2, Crop, Scissors, Image as ImageIcon, 
  PenTool, Download, ZoomIn, ZoomOut, 
  Palette, Check, X, ClipboardPaste, CheckCircle, AlertCircle, 
  Type, Square, Circle, Minus, PlusCircle, Trash2, AlignLeft, 
  AlignCenter, AlignRight, Bold, Italic, Sparkles, FileText,
  Menu, ChevronUp, ChevronDown, FileDown
} from "lucide-react";
import dynamic from "next/dynamic";
import { CanvasNode } from "@/components/KonvaEditor";
import { v4 as uuidv4 } from "uuid";
import { CERTIFICATE_TEMPLATES, ThemeColors } from "@/lib/certificate-templates";
import { motion, AnimatePresence } from "framer-motion";

const KonvaEditor = dynamic(() => import("@/components/KonvaEditor").then((mod) => mod.KonvaEditor), {
  ssr: false,
});

function CertificateBuilderContent() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("templateId");
  
  const [events, setEvents] = useState<{id: string, title: string, startDate?: string}[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<{id: string, title: string, startDate?: string} | null>(null);

  const [templateName, setTemplateName] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState<string>("");
  const [userTemplates, setUserTemplates] = useState<{id: string, name: string, fileUrl?: string, fields?: Record<string, unknown>}[]>([]);
  
  // Theme and Template State
  const [activeTemplate, setActiveTemplate] = useState(CERTIFICATE_TEMPLATES[0]);
  const [themeColors, setThemeColors] = useState<ThemeColors>(CERTIFICATE_TEMPLATES[0].theme);
  
  // Nodes state
  const [nodes, setNodes] = useState<CanvasNode[]>(activeTemplate.nodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const [clipboard, setClipboard] = useState<CanvasNode | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  
  const [facultyName, setFacultyName] = useState("Dr. Anjali Mehta");
  const [facultyTitle, setFacultyTitle] = useState("Head of Department");

  // Mobile layout state
  const [isMobile, setIsMobile] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"canvas" | "theme" | "tools" | "properties">("canvas");

  // Popout Navigation Bar state
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  const [popoutTab, setPopoutTab] = useState<"properties" | "tools" | "theme" | "presets" | "templates" | "ai">("properties");

  // Desktop layout state
  const [isLeftPanelExpanded, setIsLeftPanelExpanded] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState<"presets" | "templates" | "theme" | null>(null);

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  // AI Suggestions state
  const [aiEventType, setAiEventType] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<{ name?: string; description?: string; fields?: any }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const handleGetSuggestions = async () => {
    if (!aiEventType.trim()) return;
    setAiLoading(true);
    try {
      const data = await api<{ suggestions: any[] }>("/certificates/suggest-template", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({ eventType: aiEventType }),
      });
      setAiSuggestions(data.suggestions || []);
      showToast(`AI generated ${data.suggestions?.length || 0} layout suggestions!`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "AI suggestion failed", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestion = (fields: any) => {
    const newColors = {
      primary: fields.borderlineColor || themeColors.primary,
      accent: fields.accentColor || themeColors.accent,
      text: fields.textColor || themeColors.text,
      background: fields.backgroundPattern === "floral" ? "#F5F2EB" : "#0A0D1A"
    };
    setThemeColors(newColors);

    const suggestedNodes: CanvasNode[] = [
      {
        id: `ai-title-${uuidv4()}`,
        type: "text",
        x: 100,
        y: 80,
        text: fields.title || "CERTIFICATE",
        fontSize: 32,
        fontFamily: fields.fontTheme === "academic" ? "serif" : "mono",
        fontStyle: "bold",
        fill: fields.textColor || "#ffffff",
        align: "center",
        width: 600,
        rotation: 0, scaleX: 1, scaleY: 1
      },
      {
        id: `ai-subtitle-${uuidv4()}`,
        type: "text",
        x: 100,
        y: 125,
        text: fields.subtitle || "OF COMPLIANCE",
        fontSize: 14,
        fontFamily: "sans-serif",
        fontStyle: "bold",
        fill: fields.accentColor || "#FF4D00",
        align: "center",
        width: 600,
        rotation: 0, scaleX: 1, scaleY: 1,
        tracking: 2
      },
      {
        id: `ai-pres-${uuidv4()}`,
        type: "text",
        x: 100,
        y: 180,
        text: fields.presentationalText || "This is to verify that security operative",
        fontSize: 12,
        fontFamily: fields.fontTheme === "academic" ? "serif" : "sans-serif",
        fontStyle: fields.fontTheme === "academic" ? "italic" : "normal",
        fill: fields.textColor || "#ffffff",
        align: "center",
        width: 600,
        rotation: 0, scaleX: 1, scaleY: 1
      },
      {
        id: `t-name-${uuidv4()}`,
        type: "text",
        x: 100,
        y: 220,
        text: "[Recipient Name]",
        fontSize: 36,
        fontFamily: fields.nameStyle === "mono" ? "mono" : fields.nameStyle?.includes("serif") ? "serif" : "sans-serif",
        fontStyle: fields.nameStyle?.includes("italic") ? "italic" : "bold",
        fill: fields.textColor || "#ffffff",
        align: "center",
        width: 600,
        isPlaceholder: true,
        placeholderType: "recipientName",
        rotation: 0, scaleX: 1, scaleY: 1
      },
      {
        id: `t-title-${uuidv4()}`,
        type: "text",
        x: 100,
        y: 290,
        text: fields.description ? fields.description.replace("{{eventTitle}}", "[Event Title]").replace("{{eventDate}}", "[Event Date]") : "For successfully completing [Event Title]",
        fontSize: 14,
        fontFamily: "sans-serif",
        fill: fields.textColor || "#ffffff",
        align: "center",
        width: 600,
        isPlaceholder: true,
        placeholderType: "eventTitle",
        rotation: 0, scaleX: 1, scaleY: 1
      },
      {
        id: `t-date-${uuidv4()}`,
        type: "text",
        x: 250,
        y: 360,
        text: "[Event Date]",
        fontSize: 12,
        fontFamily: "sans-serif",
        fill: fields.textColor || "#ffffff",
        align: "center",
        width: 300,
        isPlaceholder: true,
        placeholderType: "eventDate",
        rotation: 0, scaleX: 1, scaleY: 1
      },
      {
        id: `t-code-${uuidv4()}`,
        type: "text",
        x: 250,
        y: 460,
        text: "CK-XXXX-XXXX",
        fontSize: 11,
        fontFamily: "mono",
        fill: fields.accentColor || "#FF4D00",
        align: "center",
        width: 300,
        isPlaceholder: true,
        placeholderType: "uniqueCode",
        rotation: 0, scaleX: 1, scaleY: 1
      },
      {
        id: `ai-border-${uuidv4()}`,
        type: "shape",
        x: 20,
        y: 20,
        width: 760,
        height: 520,
        fill: "transparent",
        stroke: fields.borderlineColor || "#CCFF00",
        strokeWidth: fields.borderWidth || 2,
        radius: 12,
        rotation: 0, scaleX: 1, scaleY: 1
      }
    ];

    setNodes(suggestedNodes);
    setSelectedId(null);
    showToast(`AI template applied: ${fields.title || 'Custom'}`, "success");
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load templates from API
  useEffect(() => {
    if (!token) return;
    const fetchTemplates = async () => {
      try {
        const data = await api<{ templates: {id: string, name: string, fileUrl?: string, fields?: Record<string, unknown>}[] }>("/certificates/templates", { token });
        setUserTemplates(data.templates);
      } catch (err) {
        console.error("Failed to load templates:", err);
      }
    };
    fetchTemplates();
  }, [token]);

  // Pre-load template if templateIdParam is present
  useEffect(() => {
    if (templateIdParam && userTemplates.length > 0) {
      const template = userTemplates.find(t => t.id === templateIdParam);
      if (template) {
        setTimeout(() => {
          setTemplateName(template.name);
          if (template.fileUrl) {
            setBackgroundUrl(getFileUrl(template.fileUrl));
          }
          if (template.fields && template.fields.type === "canvas_builder") {
            if (template.fields.themeColors) {
              setThemeColors(template.fields.themeColors as ThemeColors);
            }
            if (template.fields.nodes) {
              setNodes(template.fields.nodes as CanvasNode[]);
            }
          } else {
            // If raw template background image, load default nodes
            setNodes([
            { id: `t-name-${uuidv4()}`, type: "text", x: 100, y: 240, text: "[Recipient Name]", fontSize: 36, fontFamily: "serif", fontStyle: "italic", fill: "#333333", align: "center", width: 600, isPlaceholder: true, placeholderType: "recipientName", rotation: 0, scaleX: 1, scaleY: 1 },
            { id: `t-title-${uuidv4()}`, type: "text", x: 100, y: 320, text: "For successfully participating in [Event Title]", fontSize: 16, fontFamily: "sans-serif", fill: "#333333", align: "center", width: 600, isPlaceholder: true, placeholderType: "eventTitle", rotation: 0, scaleX: 1, scaleY: 1 },
            { id: `t-date-${uuidv4()}`, type: "text", x: 250, y: 370, text: "[Event Date]", fontSize: 14, fontFamily: "sans-serif", fill: "#555555", align: "center", width: 300, isPlaceholder: true, placeholderType: "eventDate", rotation: 0, scaleX: 1, scaleY: 1 },
            { id: `t-code-${uuidv4()}`, type: "text", x: 250, y: 470, text: "CK-XXXX-XXXX", fontSize: 12, fontFamily: "mono", fill: "#888888", align: "center", width: 300, isPlaceholder: true, placeholderType: "uniqueCode", rotation: 0, scaleX: 1, scaleY: 1 }
          ]);
          }
          showToast(`Editing custom template: ${template.name}`, "info");
        }, 0);
      }
    }
  }, [templateIdParam, userTemplates, showToast]);

  // Auto-zoom to fit screen width on mobile and track isMobile state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        const padding = 32;
        const availableWidth = window.innerWidth - padding;
        if (availableWidth < 800) {
          setZoom(Math.max(0.35, Math.min(1, availableWidth / 800)));
        } else {
          setZoom(1);
        }
      } else {
        setZoom(1);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-focus properties tab on mobile when a node is selected
  useEffect(() => {
    if (selectedId && isMobile) {
      setTimeout(() => setActiveSidebarTab("properties"), 0);
    } else if (!selectedId && activeSidebarTab === "properties") {
      setTimeout(() => setActiveSidebarTab("tools"), 0);
    }
  }, [selectedId, isMobile, activeSidebarTab]);

  useEffect(() => {
    if (!token) return;
    const fetchEvents = async () => {
      try {
        const data = await api<{ events: {id: string, title: string, startDate?: string}[] }>("/events/all", { token });
        setEvents(data.events);
      } catch (err) {
        console.error("Failed to load events:", err);
      }
    };
    fetchEvents();
  }, [token]);

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    const ev = events.find(e => e.id === eventId);
    setSelectedEvent(ev || null);
  };

  const handleTemplateSwitch = (templateId: string) => {
    const template = CERTIFICATE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    setActiveTemplate(template);
    setThemeColors(template.theme);
    setBackgroundUrl(""); // clear custom uploaded background image
    
    // Preserve custom nodes
    const customNodes = nodes.filter(n => n.isLogo || n.isSignature || n.id.startsWith("custom-") || n.id.startsWith("text-") || n.id.startsWith("shape-"));
    setNodes([...template.nodes, ...customNodes]);
    setSelectedId(null);
    showToast(`Switched to template: ${template.name}`, "success");
  };

  const handleUserTemplateSwitch = (template: any) => {
    setTemplateName(template.name);
    if (template.fileUrl) {
      setBackgroundUrl(getFileUrl(template.fileUrl));
    }
    
    if (template.fields && template.fields.type === "canvas_builder") {
      if (template.fields.themeColors) setThemeColors(template.fields.themeColors);
      if (template.fields.nodes) setNodes(template.fields.nodes);
    } else {
      // Default nodes for raw uploaded template image background
      setNodes([
        { id: `t-name-${uuidv4()}`, type: "text", x: 100, y: 240, text: "[Recipient Name]", fontSize: 36, fontFamily: "serif", fontStyle: "italic", fill: "#333333", align: "center", width: 600, isPlaceholder: true, placeholderType: "recipientName", rotation: 0, scaleX: 1, scaleY: 1 },
        { id: `t-title-${uuidv4()}`, type: "text", x: 100, y: 320, text: "For successfully participating in [Event Title]", fontSize: 16, fontFamily: "sans-serif", fill: "#333333", align: "center", width: 600, isPlaceholder: true, placeholderType: "eventTitle", rotation: 0, scaleX: 1, scaleY: 1 },
        { id: `t-date-${uuidv4()}`, type: "text", x: 250, y: 370, text: "[Event Date]", fontSize: 14, fontFamily: "sans-serif", fill: "#555555", align: "center", width: 300, isPlaceholder: true, placeholderType: "eventDate", rotation: 0, scaleX: 1, scaleY: 1 },
        { id: `t-code-${uuidv4()}`, type: "text", x: 250, y: 470, text: "CK-XXXX-XXXX", fontSize: 12, fontFamily: "mono", fill: "#888888", align: "center", width: 300, isPlaceholder: true, placeholderType: "uniqueCode", rotation: 0, scaleX: 1, scaleY: 1 }
      ]);
    }
    setSelectedId(null);
    showToast(`Loaded background template: ${template.name}`, "success");
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setThemeColors(prev => ({ ...prev, [key]: value }));
  };

  // Tool Handlers
  const handleCut = () => {
    if (selectedId) {
      const node = nodes.find(n => n.id === selectedId);
      if (node) {
        setClipboard(node);
        setNodes(nodes.filter(n => n.id !== selectedId));
        setSelectedId(null);
        showToast("Cut element to clipboard", "info");
      }
    }
  };

  const handlePaste = () => {
    if (clipboard) {
      const newNode = { ...clipboard, id: uuidv4(), x: clipboard.x + 20, y: clipboard.y + 20 };
      setNodes([...nodes, newNode]);
      setSelectedId(newNode.id);
      showToast("Pasted element", "success");
    }
  };

  // Add generic text element
  const addTextNode = (placeholderType?: string) => {
    let defaultText = "Double click to edit";
    let isPlaceholder = false;
    if (placeholderType === "recipientName") {
      defaultText = "[Recipient Name]";
      isPlaceholder = true;
    } else if (placeholderType === "eventTitle") {
      defaultText = "[Event Title]";
      isPlaceholder = true;
    } else if (placeholderType === "eventDate") {
      defaultText = "[Event Date]";
      isPlaceholder = true;
    } else if (placeholderType === "uniqueCode") {
      defaultText = "CK-XXXX-XXXX";
      isPlaceholder = true;
    }

    const newNode: CanvasNode = {
      id: `text-${uuidv4()}`,
      type: "text",
      x: 250,
      y: 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      text: defaultText,
      fontSize: 24,
      fontFamily: "sans-serif",
      fill: themeColors.text || "#333333",
      align: "center",
      width: 300,
      isPlaceholder,
      placeholderType
    };
    setNodes([...nodes, newNode]);
    setSelectedId(newNode.id);
    showToast(`Added text element`, "success");
  };

  // Add custom shape
  const addShapeNode = (shapeType: "rect" | "circle" | "line") => {
    const id = `shape-${uuidv4()}`;
    let newNode: CanvasNode;
    if (shapeType === "rect") {
      newNode = {
        id,
        type: "shape",
        x: 300, y: 200,
        width: 150, height: 100,
        fill: themeColors.primary || "#B8860B",
        stroke: themeColors.accent || "#DAA520",
        strokeWidth: 2,
        radius: 0,
        rotation: 0, scaleX: 1, scaleY: 1
      };
    } else if (shapeType === "circle") {
      newNode = {
        id,
        type: "shape",
        x: 350, y: 200,
        width: 100, height: 100,
        fill: themeColors.primary || "#B8860B",
        stroke: themeColors.accent || "#DAA520",
        strokeWidth: 2,
        radius: 50,
        rotation: 0, scaleX: 1, scaleY: 1
      };
    } else {
      newNode = {
        id,
        type: "shape",
        x: 250, y: 250,
        width: 300, height: 4,
        fill: themeColors.accent || "#DAA520",
        rotation: 0, scaleX: 1, scaleY: 1
      };
    }
    setNodes([...nodes, newNode]);
    setSelectedId(newNode.id);
    showToast(`Added ${shapeType} shape`, "success");
  };

  const updateSelectedNode = (attrs: Partial<CanvasNode>) => {
    if (!selectedId) return;
    setNodes(nodes.map(n => n.id === selectedId ? { ...n, ...attrs } : n));
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    if (selectedId === id) setSelectedId(null);
    showToast("Deleted element", "info");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newNode: CanvasNode = {
          id: `custom-logo-${uuidv4()}`, type: "image", x: 350, y: 50, rotation: 0, scaleX: 1, scaleY: 1,
          width: 100, height: 100, src: ev.target?.result as string, isLogo: true
        };
        setNodes([...nodes, newNode]);
        setSelectedId(newNode.id);
        showToast("Uploaded organization logo", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const placeLogo = (position: 'top-left' | 'top-center' | 'top-right') => {
    if (!selectedId) return;
    setNodes(nodes.map(n => {
      if (n.id === selectedId) {
        let x = n.x;
        if (position === 'top-left') x = 50;
        if (position === 'top-center') x = 400 - (n.width || 100) / 2;
        if (position === 'top-right') x = 750 - (n.width || 100);
        return { ...n, x, y: 50 };
      }
      return n;
    }));
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const sigId = `custom-sig-${uuidv4()}`;
        const nameId = `custom-sig-name-${uuidv4()}`;
        const titleId = `custom-sig-title-${uuidv4()}`;
        
        const sigNode: CanvasNode = {
          id: sigId, type: "image", x: 600, y: 400, rotation: 0, scaleX: 1, scaleY: 1,
          width: 150, height: 80, src: ev.target?.result as string, isSignature: true
        };
        const nameNode: CanvasNode = {
          id: nameId, type: "text", x: 600, y: 490, rotation: 0, scaleX: 1, scaleY: 1,
          text: facultyName, fontSize: 16, fontFamily: "sans-serif", fill: themeColors.text, align: "center", width: 150, isSignature: true
        };
        const titleNode: CanvasNode = {
          id: titleId, type: "text", x: 600, y: 510, rotation: 0, scaleX: 1, scaleY: 1,
          text: facultyTitle, fontSize: 12, fontFamily: "sans-serif", fill: themeColors.text, align: "center", width: 150, isSignature: true
        };
        setNodes([...nodes, sigNode, nameNode, titleNode]);
        showToast("Uploaded signature and labels", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropApply = (cropData: { x: number; y: number; width: number; height: number; }) => {
    if (selectedId) {
      setNodes(nodes.map(n => n.id === selectedId ? { ...n, crop: cropData } : n));
    }
  };

  const moveLayer = (direction: 'up' | 'down' | 'front' | 'back') => {
    if (!selectedId) return;
    const index = nodes.findIndex(n => n.id === selectedId);
    if (index === -1) return;
    
    const newNodes = [...nodes];
    const item = newNodes[index];
    
    if (direction === 'up' && index < nodes.length - 1) {
      [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
    } else if (direction === 'down' && index > 0) {
      [newNodes[index], newNodes[index - 1]] = [newNodes[index - 1], newNodes[index]];
    } else if (direction === 'front') {
      newNodes.splice(index, 1);
      newNodes.push(item);
    } else if (direction === 'back') {
      newNodes.splice(index, 1);
      newNodes.unshift(item);
    }
    setNodes(newNodes);
  };

  const handleExportPNG = async () => {
    const stage = document.querySelector("#certificate-stage") as HTMLElement;
    if (stage) {
      const canvasEl = stage.querySelector("canvas");
      if (canvasEl) {
        const link = document.createElement("a");
        link.download = `${templateName || "certificate_design"}.png`;
        link.href = canvasEl.toDataURL("image/png");
        link.click();
        showToast("Design exported as high-resolution PNG", "success");
      } else {
        showToast("Canvas element not found", "error");
      }
    }
  };

  const handleExportPDF = async () => {
    const stage = document.querySelector("#certificate-stage") as HTMLElement;
    if (!stage) return showToast("Canvas not found", "error");
    const canvasEl = stage.querySelector("canvas");
    if (!canvasEl) return showToast("Canvas element not ready", "error");

    const dataUrl = canvasEl.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${templateName || "Certificate"}</title>
            <style>
              @page { size: landscape; margin: 0; }
              body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: #000; height: 100vh; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print();" />
          </body>
        </html>
      `);
      printWindow.document.close();
      showToast("Preparing PDF download dialog...", "success");
    } else {
      showToast("Pop-up blocked. Please allow pop-ups for PDF print export.", "error");
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) return showToast("Template name is required", "error");
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", templateName);
      
      let blob: Blob | null = null;
      const stage = document.querySelector("#certificate-stage") as HTMLElement;
      if (stage) {
        const canvasEl = stage.querySelector("canvas");
        if (canvasEl) {
          blob = await new Promise<Blob | null>(resolve => canvasEl.toBlob(resolve, "image/png"));
        }
      }
      
      if (!blob) {
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 560;
        blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
      }

      if (blob) {
        formData.append("template", new File([blob], "design_preview.png", { type: "image/png" }));
      }
      
      const fieldsConfig = {
        type: "canvas_builder",
        themeColors,
        templateId: activeTemplate.id,
        nodes: nodes
      };
      
      formData.append("fields", JSON.stringify(fieldsConfig));
      
      if (templateIdParam) {
        await apiUpload(`/certificates/templates/${templateIdParam}`, formData, token || undefined, "PUT");
        showToast("Template updated successfully!", "success");
      } else {
        await apiUpload("/certificates/templates", formData, token || undefined, "POST");
        showToast("Template deployed successfully!", "success");
      }
      
      setTimeout(() => {
        router.push("/dashboard/certificates");
      }, 1000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save template", "error");
    } finally {
      setSaving(false);
    }
  };

  const getEventTitle = () => selectedEvent ? selectedEvent.title : "[Event Title]";
  const getEventDate = () => {
    if (!selectedEvent || !selectedEvent.startDate) return "[Event Date]";
    return new Date(selectedEvent.startDate).toLocaleDateString("en-IN", {
      year: "numeric", month: "long", day: "numeric"
    });
  };

  const selectedNode = nodes.find(n => n.id === selectedId);

  // ─── Control Block Helpers (reused on desktop and mobile) ───
  const aiAssistantBlock = () => (
    <div className="space-y-3 bg-purple-950/20 p-3.5 rounded-xl border border-purple-500/20">
      <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2 font-mono">
        <Sparkles className="w-4 h-4 text-purple-400" /> AI Design Assistant
      </h3>
      <p className="text-[10px] text-slate-400 font-mono">
        Enter event category to get layout and coordinate suggestions.
      </p>
      <div className="flex gap-2">
        <input
          className="bg-black/60 border border-purple-900/40 focus:border-purple-500 focus:outline-none rounded-lg text-xs text-slate-300 placeholder-slate-650 px-2.5 py-1.5 flex-1 font-mono"
          placeholder="e.g. Cyber Security Hackathon"
          value={aiEventType}
          onChange={(e) => setAiEventType(e.target.value)}
        />
        <button
          onClick={handleGetSuggestions}
          disabled={aiLoading || !aiEventType.trim()}
          className="bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 font-bold"
        >
          {aiLoading ? "..." : "SUGGEST"}
        </button>
      </div>

      {aiSuggestions.length > 0 && (
        <div className="space-y-1.5 pt-2">
          <label className="text-[9px] text-slate-550 uppercase font-mono">Select suggestion to apply</label>
          {aiSuggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => applyAISuggestion(s.fields)}
              className="w-full text-left p-2 rounded-lg bg-black/40 border border-purple-900/30 hover:border-purple-500/50 text-[11px] transition-all cursor-pointer"
            >
              <div className="font-bold text-slate-200 font-mono">{s.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{s.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const addElementsBlock = () => (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
        <PlusCircle className="w-4 h-4 text-[var(--ck-lime)]" /> Add Elements
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={() => addTextNode()}
          className="p-2 rounded-lg text-xs bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer font-mono font-bold"
        >
          <Type className="w-3.5 h-3.5 text-blue-400" /> + Custom Text
        </button>
        <button 
          onClick={() => addTextNode("recipientName")}
          className="p-2 rounded-lg text-xs bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer font-mono font-bold"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> + Recipient
        </button>
        <button 
          onClick={() => addTextNode("eventTitle")}
          className="p-2 rounded-lg text-xs bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer font-mono font-bold"
        >
          <PlusCircle className="w-3.5 h-3.5 text-purple-400" /> + Event Title
        </button>
        <button 
          onClick={() => addTextNode("eventDate")}
          className="p-2 rounded-lg text-xs bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer font-mono font-bold"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-400" /> + Event Date
        </button>
        <button 
          onClick={() => addTextNode("uniqueCode")}
          className="p-2 rounded-lg text-xs bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex items-center gap-1.5 col-span-2 cursor-pointer font-mono font-bold"
        >
          <PlusCircle className="w-3.5 h-3.5 text-cyan-400" /> + Certificate ID (Unique Code)
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button 
          onClick={() => addShapeNode("rect")}
          className="p-2 rounded-lg text-xs bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex flex-col items-center gap-1 cursor-pointer font-mono font-bold"
        >
          <Square className="w-4 h-4 text-amber-500" /> Rect
        </button>
        <button 
          onClick={() => addShapeNode("circle")}
          className="p-2 rounded-lg text-xs bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex flex-col items-center gap-1 cursor-pointer font-mono font-bold"
        >
          <Circle className="w-4 h-4 text-emerald-500" /> Circle
        </button>
        <button 
          onClick={() => addShapeNode("line")}
          className="p-2 rounded-lg text-xs bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex flex-col items-center gap-1 cursor-pointer font-mono font-bold"
        >
          <Minus className="w-4 h-4 text-rose-500" /> Line
        </button>
      </div>
    </div>
  );

  const studioActionsBlock = () => (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
        <Settings2 className="w-4 h-4 text-blue-400" /> Studio Actions
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <button 
          onClick={() => setIsCropping(!isCropping)}
          className={`p-2 rounded-lg text-xs flex flex-col items-center justify-center gap-1.5 transition-colors border cursor-pointer font-mono font-bold ${isCropping ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-zinc-900/60 border-zinc-850 hover:border-zinc-700 text-slate-300'}`}
        >
          <Crop className="w-3.5 h-3.5" /> Crop
        </button>
        <button onClick={handleCut} disabled={!selectedId} className="p-2 rounded-lg text-xs flex flex-col items-center justify-center gap-1.5 bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700 text-slate-300 transition-colors disabled:opacity-30 cursor-pointer font-mono font-bold">
          <Scissors className="w-3.5 h-3.5" /> Cut
        </button>
        <button onClick={handlePaste} disabled={!clipboard} className="p-2 rounded-lg text-xs flex flex-col items-center justify-center gap-1.5 bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700 text-slate-300 transition-colors disabled:opacity-30 cursor-pointer font-mono font-bold">
          <ClipboardPaste className="w-3.5 h-3.5" /> Paste
        </button>
      </div>
    </div>
  );

  const orgLogoBlock = () => (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
        <ImageIcon className="w-4 h-4 text-purple-400" /> Organization Logo
      </h3>
      <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
      <button onClick={() => logoInputRef.current?.click()} className="w-full py-2 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 rounded-lg text-xs transition-colors font-mono cursor-pointer font-bold uppercase">
        + UPLOAD_LOGO
      </button>
      {selectedNode?.isLogo && (
        <div className="flex gap-1 pt-1">
          <button onClick={() => placeLogo('top-left')} className="flex-1 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-slate-400 hover:text-white font-mono cursor-pointer font-semibold">Top L</button>
          <button onClick={() => placeLogo('top-center')} className="flex-1 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-slate-400 hover:text-white font-mono cursor-pointer font-semibold">Center</button>
          <button onClick={() => placeLogo('top-right')} className="flex-1 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-slate-400 hover:text-white font-mono cursor-pointer font-semibold">Top R</button>
        </div>
      )}
    </div>
  );

  const facultySignatureBlock = () => (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
        <PenTool className="w-4 h-4 text-blue-400" /> Faculty Signature
      </h3>
      <input 
        className="ck-input text-xs py-1.5 px-3 bg-black/40 border-zinc-800 w-full font-mono text-slate-200" 
        placeholder="Faculty Name (e.g. Dr. Anjali)" 
        value={facultyName} onChange={e => setFacultyName(e.target.value)} 
      />
      <input 
        className="ck-input text-xs py-1.5 px-3 bg-black/40 border-zinc-800 w-full font-mono text-slate-200" 
        placeholder="Faculty Designation (e.g. Dean)" 
        value={facultyTitle} onChange={e => setFacultyTitle(e.target.value)} 
      />
      <input type="file" accept="image/png" className="hidden" ref={signatureInputRef} onChange={handleSignatureUpload} />
      <button onClick={() => signatureInputRef.current?.click()} className="w-full py-2 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-300 rounded-lg text-xs transition-colors font-mono cursor-pointer font-bold uppercase">
        + UPLOAD_SIGNATURE_PNG
      </button>
    </div>
  );

  const presetsBlock = () => (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
        <Layout className="w-4 h-4 text-pink-400" /> Preset Layouts
      </h3>
      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
        {CERTIFICATE_TEMPLATES.map(t => (
          <button 
            key={t.id} 
            onClick={() => handleTemplateSwitch(t.id)}
            className={`w-full text-left p-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${activeTemplate.id === t.id && !backgroundUrl ? 'bg-pink-500/20 border border-pink-500/50 text-pink-100' : 'bg-zinc-900 border border-zinc-800 text-slate-400 hover:bg-zinc-800'}`}
          >
            <div className="flex items-center justify-between font-mono font-semibold">
              {t.name}
              {activeTemplate.id === t.id && !backgroundUrl && <Check className="w-3.5 h-3.5 text-pink-400" />}
            </div>
            <div className="mt-2 flex gap-1">
              <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" style={{ backgroundColor: t.theme.primary }} />
              <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" style={{ backgroundColor: t.theme.background }} />
              <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" style={{ backgroundColor: t.theme.accent }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const uploadedTemplatesBlock = () => (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
        <Upload className="w-4 h-4 text-cyan-400" /> Uploaded Templates
      </h3>
      {userTemplates.length === 0 ? (
        <p className="text-[10px] text-slate-500 text-center py-4 bg-zinc-900/20 rounded-xl border border-zinc-800/40 font-mono">No uploaded templates found.</p>
      ) : (
        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
          {userTemplates.map(t => (
            <button 
              key={t.id} 
              onClick={() => handleUserTemplateSwitch(t)}
              className={`w-full text-left p-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${t.fileUrl && backgroundUrl.includes(t.fileUrl) ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-100' : 'bg-zinc-900 border border-zinc-850 text-slate-400 hover:bg-zinc-800'}`}
            >
              <div className="flex items-center justify-between gap-2 font-mono font-semibold">
                <span className="truncate flex-1">{t.name}</span>
                {t.fileUrl && backgroundUrl.includes(t.fileUrl) && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              </div>
              {t.fileUrl && (
                <div className="mt-2 h-14 w-full rounded bg-black border border-zinc-800 overflow-hidden relative flex items-center justify-center">
                  {t.fileUrl.toLowerCase().endsWith(".pdf") ? (
                    <div className="flex flex-col items-center gap-1">
                      <FileText className="w-5 h-5 text-[#4B5563]" />
                      <span className="text-[8px] font-mono text-[#4B5563]">PDF</span>
                    </div>
                  ) : (
                    <img src={getFileUrl(t.fileUrl)} alt={t.name} className="w-full h-full object-cover" />
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const themeColorsBlock = () => (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
        <Palette className="w-4 h-4 text-emerald-400" /> Theme Colors
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'primary', label: 'Primary' },
          { key: 'background', label: 'Background' },
          { key: 'text', label: 'Text' },
          { key: 'accent', label: 'Accent' }
        ].map(c => (
          <div key={c.key} className="space-y-1">
            <label className="text-[9px] text-slate-500 uppercase font-mono">{c.label}</label>
            <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
              <input 
                type="color" 
                value={themeColors[c.key as keyof ThemeColors] || "#ffffff"} 
                onChange={(e) => handleColorChange(c.key as keyof ThemeColors, e.target.value)}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <span className="text-[10px] text-slate-300 font-mono truncate">{themeColors[c.key as keyof ThemeColors]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const propertyEditorBlock = () => (
    <div className="space-y-4">
      {selectedNode ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Settings2 className="w-4 h-4 text-pink-400" /> Property Editor
            </h3>
            <button 
              onClick={() => handleDeleteNode(selectedNode.id)}
              className="p-1 rounded bg-red-950/40 border border-red-900/30 text-red-400 hover:bg-red-900 hover:text-white transition-colors cursor-pointer"
              title="Delete Element"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Text Specific Settings */}
          {selectedNode.type === "text" && (
            <div className="space-y-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/80">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-mono">Text Content</label>
                <textarea 
                  className="ck-input text-xs w-full mt-1.5 bg-black/40 border-zinc-800 focus:border-[var(--ck-lime)] text-slate-200 font-mono"
                  rows={2}
                  value={selectedNode.text || ""}
                  onChange={(e) => updateSelectedNode({ text: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Font Size</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="range" min="10" max="100" step="1" 
                      className="w-full accent-[var(--ck-lime)] cursor-pointer"
                      value={selectedNode.fontSize || 16}
                      onChange={(e) => updateSelectedNode({ fontSize: parseInt(e.target.value) || 16 })}
                    />
                    <span className="text-xs font-mono w-6 text-right text-slate-300">{selectedNode.fontSize}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Tracking</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="range" min="-3" max="25" step="1" 
                      className="w-full accent-[var(--ck-lime)] cursor-pointer"
                      value={selectedNode.tracking || 0}
                      onChange={(e) => updateSelectedNode({ tracking: parseInt(e.target.value) || 0 })}
                    />
                    <span className="text-xs font-mono w-6 text-right text-slate-300">{selectedNode.tracking}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Font Family</label>
                  <select 
                    className="ck-input text-xs mt-1 w-full bg-black/50 border-zinc-800 font-mono"
                    value={selectedNode.fontFamily || "sans-serif"}
                    onChange={(e) => updateSelectedNode({ fontFamily: e.target.value })}
                  >
                    <option value="sans-serif">Sans-Serif (Inter)</option>
                    <option value="serif">Serif (Playfair)</option>
                    <option value="mono">Monospace (Share Tech)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Placeholder Type</label>
                  <select 
                    className="ck-input text-xs mt-1 w-full bg-black/50 border-zinc-800 font-mono"
                    value={selectedNode.isPlaceholder ? (selectedNode.placeholderType || "recipientName") : "none"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "none") {
                        updateSelectedNode({ isPlaceholder: false, placeholderType: undefined });
                      } else {
                        updateSelectedNode({ isPlaceholder: true, placeholderType: val });
                      }
                    }}
                  >
                    <option value="none">Normal Text</option>
                    <option value="recipientName">Recipient Name</option>
                    <option value="eventTitle">Event Title</option>
                    <option value="eventDate">Event Date</option>
                    <option value="uniqueCode">Certificate ID</option>
                  </select>
                </div>
              </div>

              {/* Formatting Styles */}
              <div className="flex items-center gap-2">
                <div className="flex bg-black/30 border border-zinc-800 rounded-lg p-0.5">
                  <button 
                    type="button"
                    onClick={() => {
                      const isBold = selectedNode.fontStyle?.includes("bold");
                      const isItalic = selectedNode.fontStyle?.includes("italic");
                      let style = "normal";
                      if (isBold && isItalic) style = "italic";
                      else if (isBold) style = "normal";
                      else if (isItalic) style = "bold italic";
                      else style = "bold";
                      updateSelectedNode({ fontStyle: style });
                    }}
                    className={`p-1.5 rounded hover:bg-zinc-800/80 transition-colors cursor-pointer ${selectedNode.fontStyle?.includes("bold") ? "text-[var(--ck-lime)] bg-zinc-800" : "text-slate-400"}`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const isBold = selectedNode.fontStyle?.includes("bold");
                      const isItalic = selectedNode.fontStyle?.includes("italic");
                      let style = "normal";
                      if (isBold && isItalic) style = "bold";
                      else if (isItalic) style = "normal";
                      else if (isBold) style = "bold italic";
                      else style = "italic";
                      updateSelectedNode({ fontStyle: style });
                    }}
                    className={`p-1.5 rounded hover:bg-zinc-800/80 transition-colors cursor-pointer ${selectedNode.fontStyle?.includes("italic") ? "text-[var(--ck-lime)] bg-zinc-800" : "text-slate-400"}`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="flex bg-black/30 border border-zinc-800 rounded-lg p-0.5 ml-auto">
                  {(["left", "center", "right"] as const).map(align => (
                    <button 
                      key={align}
                      type="button"
                      onClick={() => updateSelectedNode({ align })}
                      className={`p-1.5 rounded hover:bg-zinc-800/80 transition-colors cursor-pointer ${selectedNode.align === align ? "text-[var(--ck-lime)] bg-zinc-800" : "text-slate-400"}`}
                    >
                      {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                      {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                      {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-mono">Text Color</label>
                <div className="flex items-center gap-2 mt-1.5 bg-black/30 p-1.5 rounded-lg border border-zinc-800">
                  <input 
                    type="color" 
                    value={selectedNode.fill || "#000000"} 
                    onChange={(e) => updateSelectedNode({ fill: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-xs text-slate-300 font-mono">{selectedNode.fill}</span>
                </div>
              </div>
            </div>
          )}

          {/* Shape Specific Settings */}
          {selectedNode.type === "shape" && (
            <div className="space-y-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/80">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Fill Color</label>
                  <div className="flex items-center gap-2 mt-1 bg-black/30 p-1 rounded-lg border border-zinc-850">
                    <input 
                      type="color" 
                      value={selectedNode.fill || "#B8860B"} 
                      onChange={(e) => updateSelectedNode({ fill: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-[10px] text-slate-300 font-mono truncate">{selectedNode.fill}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Stroke/Border</label>
                  <div className="flex items-center gap-2 mt-1 bg-black/30 p-1 rounded-lg border border-zinc-850">
                    <input 
                      type="color" 
                      value={selectedNode.stroke || "#DAA520"} 
                      onChange={(e) => updateSelectedNode({ stroke: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-[10px] text-slate-300 font-mono truncate">{selectedNode.stroke || "None"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Stroke Width</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="range" min="0" max="15" step="1" 
                      className="w-full accent-[var(--ck-lime)] cursor-pointer"
                      value={selectedNode.strokeWidth || 0}
                      onChange={(e) => updateSelectedNode({ strokeWidth: parseInt(e.target.value) || 0 })}
                    />
                    <span className="text-xs font-mono w-4 text-right text-slate-300">{selectedNode.strokeWidth || 0}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Corner Radius</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="range" min="0" max="100" step="1" 
                      className="w-full accent-[var(--ck-lime)] cursor-pointer"
                      value={selectedNode.radius || 0}
                      onChange={(e) => updateSelectedNode({ radius: parseInt(e.target.value) || 0 })}
                    />
                    <span className="text-xs font-mono w-4 text-right text-slate-300">{selectedNode.radius || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Layer Ordering Controls */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900/80 rounded-lg border border-zinc-800">
            <button onClick={() => moveLayer('back')} className="py-1 text-[9px] font-mono hover:text-white text-slate-400 bg-black/20 hover:bg-black/40 rounded transition-colors cursor-pointer" title="Send to Back">To Back</button>
            <button onClick={() => moveLayer('down')} className="py-1 text-[9px] font-mono hover:text-white text-slate-400 bg-black/20 hover:bg-black/40 rounded transition-colors cursor-pointer" title="Move Backward">Backwd</button>
            <button onClick={() => moveLayer('up')} className="py-1 text-[9px] font-mono hover:text-white text-slate-400 bg-black/20 hover:bg-black/40 rounded transition-colors cursor-pointer" title="Move Forward">Forwd</button>
            <button onClick={() => moveLayer('front')} className="py-1 text-[9px] font-mono hover:text-white text-slate-400 bg-black/20 hover:bg-black/40 rounded transition-colors cursor-pointer" title="Bring to Front">To Front</button>
          </div>
        </>
      ) : (
        <p className="text-xs font-mono text-zinc-550 text-center py-6 bg-zinc-900/10 rounded-xl border border-dashed border-zinc-800">Select an element to edit properties.</p>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-var(--ck-topbar-height,56px)-0.75rem)] flex flex-col text-white bg-[#030712] p-1.5 sm:p-3 rounded-2xl overflow-hidden font-sans relative border border-[#121F3D]">
      
      {/* Top Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 px-3 sm:px-4 py-2 border-b border-[#121F3D] bg-[#050A18]/90 rounded-t-xl shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-[#FFD700] to-[#00F5D4] bg-clip-text text-transparent flex items-center gap-2 shrink-0 font-mono">
            <Layout className="w-4 h-4 text-[#FFD700]" /> Certificate Studio
          </h1>
          <div className="hidden sm:block h-5 w-px bg-zinc-800" />
          <input 
            className="bg-[#080E24] border border-[#121F3D] focus:border-[#FFD700] focus:outline-none rounded-lg text-xs text-slate-200 placeholder-slate-500 px-3 py-1 w-full sm:w-60 font-mono" 
            placeholder="Template Name..." 
            value={templateName} 
            onChange={(e) => setTemplateName(e.target.value)} 
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select 
            className="ck-input text-xs py-1 px-2.5 bg-[#080E24] border-[#121F3D] w-full sm:w-44 text-slate-200" 
            value={selectedEventId} 
            onChange={(e) => handleEventSelect(e.target.value)}
          >
            <option value="">Select Event (Preview)</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>

          {/* Export Action Buttons */}
          <button 
            onClick={handleExportPDF} 
            className="bg-[#080E24] border border-[#FFD700]/40 hover:bg-[#FFD700]/10 text-[#FFD700] px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(255,215,0,0.15)]"
            title="Download Certificate as PDF format"
          >
            <FileDown className="w-3.5 h-3.5 text-[#FFD700]" /> Save PDF
          </button>
          
          <button 
            onClick={handleExportPNG} 
            className="bg-[#080E24] border border-[#00F5D4]/40 hover:bg-[#00F5D4]/10 text-[#00F5D4] px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,245,212,0.15)]"
            title="Download Certificate as PNG format"
          >
            <Download className="w-3.5 h-3.5 text-[#00F5D4]" /> Save PNG
          </button>

          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="bg-gradient-to-r from-[#FFD700] to-[#E5A93C] hover:opacity-95 text-black px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,215,0,0.3)] disabled:opacity-50 cursor-pointer"
          >
            {saving ? <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {templateIdParam ? "Update" : "Deploy"}
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#04070A]">
        
        {/* Stage View Area (Screen Fitting & Responsive Canvas Scaling) */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-6 pb-20 relative hacker-scanline-bg">
          <KonvaEditor 
            nodes={nodes} 
            setNodes={setNodes} 
            eventTitle={getEventTitle()} 
            eventDate={getEventDate()} 
            backgroundColor={themeColors.background}
            themeColor={themeColors.primary}
            backgroundUrl={backgroundUrl || undefined}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            isCropping={isCropping}
            onCropApply={handleCropApply}
            scale={zoom}
          />

          {/* Zoom Controls */}
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/75 backdrop-blur-md border border-[#121F3D] px-3 py-1 rounded-full z-10 scale-90 sm:scale-100">
            <button onClick={() => setZoom(z => Math.max(0.35, z - 0.1))} className="p-1 hover:text-[#00F5D4] text-slate-400 bg-transparent border-0 cursor-pointer"><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className="text-[11px] font-mono w-10 text-center text-slate-300">{Math.round(zoom * 100)}%</span>
            <input type="range" min="0.35" max="2" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-16 sm:w-24 accent-[#00F5D4] cursor-pointer" />
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1 hover:text-[#00F5D4] text-slate-400 bg-transparent border-0 cursor-pointer"><ZoomIn className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* Slide-Up Popout Drawer Panel */}
        <AnimatePresence>
          {isPopoutOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute bottom-14 left-0 right-0 max-h-[60vh] bg-[#050A18]/95 backdrop-blur-xl border-t border-[#121F3D] z-40 shadow-2xl overflow-y-auto p-4 sm:p-6 custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-[#121F3D] pb-3 mb-4 max-w-5xl mx-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FFD700]">
                    STUDIO MANAGEMENT MODULE
                  </span>
                </div>
                <button 
                  onClick={() => setIsPopoutOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 border border-[#121F3D] text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4 text-[#FFD700]" /> Collapse
                </button>
              </div>

              <div className="max-w-5xl mx-auto space-y-4">
                {popoutTab === "properties" && (
                  <div>
                    {propertyEditorBlock()}
                  </div>
                )}
                {popoutTab === "tools" && (
                  <div className="space-y-4">
                    {addElementsBlock()}
                    <div className="w-full h-px bg-[#121F3D]" />
                    {orgLogoBlock()}
                    <div className="w-full h-px bg-[#121F3D]" />
                    {facultySignatureBlock()}
                  </div>
                )}
                {popoutTab === "theme" && (
                  <div className="space-y-4">
                    {themeColorsBlock()}
                  </div>
                )}
                {popoutTab === "presets" && (
                  <div className="space-y-4">
                    {presetsBlock()}
                  </div>
                )}
                {popoutTab === "templates" && (
                  <div className="space-y-4">
                    {uploadedTemplatesBlock()}
                  </div>
                )}
                {popoutTab === "ai" && (
                  <div className="space-y-4">
                    {aiAssistantBlock()}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* INTELLIGENT BOTTOM POPOUT NAVIGATION BAR */}
        <div className="h-14 bg-[#050A18] border-t border-[#121F3D] flex items-center justify-between px-3 sm:px-6 z-50 shrink-0">
          
          {/* Arrow Popout Toggle Button */}
          <button 
            onClick={() => setIsPopoutOpen(!isPopoutOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080E24] border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700] hover:text-black font-mono font-bold text-xs transition-all shadow-[0_0_12px_rgba(255,215,0,0.2)] cursor-pointer shrink-0"
            title={isPopoutOpen ? "Collapse Navigation Bar" : "Popout Navigation Controls"}
          >
            {isPopoutOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4 animate-bounce" />}
            <span className="hidden sm:inline uppercase tracking-wider">{isPopoutOpen ? "Hide Controls" : "Popout Controls"}</span>
          </button>

          {/* Intelligent Quick Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar px-2">
            {[
              { id: "properties", label: "Properties", icon: <Settings2 className="w-3.5 h-3.5" />, color: "text-[#00F5D4]", activeBg: "bg-[#00F5D4]/15 border-[#00F5D4]/40" },
              { id: "tools", label: "Elements", icon: <PlusCircle className="w-3.5 h-3.5" />, color: "text-[#FFD700]", activeBg: "bg-[#FFD700]/15 border-[#FFD700]/40" },
              { id: "theme", label: "Theme", icon: <Palette className="w-3.5 h-3.5" />, color: "text-emerald-400", activeBg: "bg-emerald-500/15 border-emerald-500/40" },
              { id: "presets", label: "Presets", icon: <Layout className="w-3.5 h-3.5" />, color: "text-pink-400", activeBg: "bg-pink-500/15 border-pink-500/40" },
              { id: "templates", label: "Templates", icon: <Upload className="w-3.5 h-3.5" />, color: "text-cyan-400", activeBg: "bg-cyan-500/15 border-cyan-500/40" },
              { id: "ai", label: "AI", icon: <Sparkles className="w-3.5 h-3.5" />, color: "text-purple-400", activeBg: "bg-purple-500/15 border-purple-500/40" }
            ].map((tab) => {
              const isActive = isPopoutOpen && popoutTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (isPopoutOpen && popoutTab === tab.id) {
                      setIsPopoutOpen(false);
                    } else {
                      setPopoutTab(tab.id as any);
                      setIsPopoutOpen(true);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all border cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? `${tab.activeBg} text-white` 
                      : "bg-[#080E24]/60 border-[#121F3D] text-slate-400 hover:text-white hover:bg-[#080E24]"
                  }`}
                >
                  <span className={tab.color}>{tab.icon}</span>
                  <span className="hidden xs:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Zoom Indicator */}
          <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-zinc-500">
            <span>ZOOM:</span>
            <span className="text-[#00F5D4] font-bold">{Math.round(zoom * 100)}%</span>
          </div>

        </div>

      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 p-4 rounded-xl border shadow-2xl ${
              toast.type === "success" 
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" 
                : toast.type === "error" 
                ? "bg-red-950/90 border-red-500/50 text-red-200" 
                : "bg-zinc-900/90 border-zinc-700/50 text-zinc-200"
            }`}
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
            <span className="text-sm font-mono tracking-tight">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80 p-0.5 rounded bg-black/30 border-0 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CertificateBuilderPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-zinc-950 flex items-center justify-center text-white font-mono">Loading Studio...</div>}>
      <CertificateBuilderContent />
    </Suspense>
  );
}
