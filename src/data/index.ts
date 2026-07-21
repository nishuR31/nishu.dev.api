const config = <Record<any, any>>{
  developer: {
    name: "Nishan Rajak",
    shortName: "Nishu",
    role: "Backend-Focused Software Engineering Student",
    tagline: "Scalable APIs, secure auth, and modular backend systems.",
    bio: "Backend-focused software engineering student specializing in scalable REST API architecture, authentication systems, and modular backend design with performance-conscious routing, middleware orchestration, and robust error handling.",
    location: "Raghunathpur, Purulia, West Bengal",
    email: "nishan.developer.dev@gmail.com",
    about: [
      "I am a passionate software engineering student with a strong focus on backend system architecture and clean, modular code.",
      "My journey began with a fascination for how data flows behind the scenes, leading me to deeply explore RESTful APIs, authentication protocols, and database optimization.",
      "When I'm not writing code, I enjoy breaking down complex problems and continuously learning about modern infrastructure to build high-performance applications.",
    ],
  },
  featuredProjects: [
    "devclip-hub",
    "ghControl",
    "baksy",
    "githubRecap",
    "beat",
    "lunarity",
    "Memory-Web2",
    "focusMode",
    "mathematicsForAll",
    "nmoh",
    "scafe",
    "ranchiKart",
    "nishu.dev",
    "boardVault"
  ],
  social: {
    github: "nishuR31",
    discord: "#",
    linkedin: "nishan-rajak-98b2ab3b8",
  },
  NAV_ITEMS: [
    { href: "/projects", label: "Projects" },
    { href: "/certificates", label: "Certificates" },
  ],
  recentTracks: true, // Enable/disable Spotify recent tracks
  projects: [
    {
      id: 1,
      title: "Devclip Hub",
      description:
        "Developer-focused utility hub with modular frontend architecture and productivity-driven tooling.",
      image: "/projects/project-1.webp",
      technologies: ["Next.js", "React", "JavaScript", "TailwindCSS", "UI/UX"],
      github: "https://github.com/nishuR31/devclip-hub",
      demo: "https://devclip-hub.vercel.app",
    },
    {
      id: 2,
      title: "Gh Control",
      description:
        "Power-user GitHub command center with repo, PR, webhook, and job controls in one dashboard.",
      image: "/projects/project-2.webp",
      technologies: [
        "Github",
        "github ghp token",
        "Node.js",
        "MongoDB",
        "Redis",
        "BullMQ",
        "REST API",
      ],
      github: "https://github.com/nishuR31/ghControl",
      demo: "https://gh-ctrl.vercel.app",
    },
    {
      id: 3,
      title: "Baksy",
      description:
        "Product-focused full-stack application with scalable backend and polished frontend experiences.",
      image: "/projects/project-3.webp",
      technologies: ["React", "Node.js", "Express", "JavaScript", "MongoDB", "API"],
      github: "https://github.com/nishuR31/baksy",
      demo: "https://baksy.vercel.app",
    },
    {
      id: 4,
      title: "Lunarity",
      description:
        "Experimental project focused on modern UI systems, interaction polish, and modular architecture.",
      image: "/projects/project-4.webp",
      technologies: ["TypeScript", "React", "Mathematics", "TailwindCSS", "Animation"],
      github: "https://github.com/nishuR31/lunarity",
      demo: "https://lunarity-xi.vercel.app",
    },
    {
      id: 5,
      title: "FocusMode",
      description:
        "Focus and productivity tracking system designed to reduce interruptions and improve workflow quality.",
      image: "/projects/project-5.webp",
      technologies: ["React", "Node.js", "TypeScript", "State Management", "UX"],
      github: "https://github.com/nishuR31/focusMode",
      demo: "https://focus-mode-on.vercel.app",
    },
    {
      id: 6,
      title: "Mathematics for All",
      description: "A curated website designed for Dr. Samir Kumar Pandey",
      image: "/projects/project-6.webp",
      technologies: [
        "Nodejs",
        "React",
        "JavaScript",
        "API",
        "MongoDB",
        "Google Console",
        "TailwindCSS",
        "Animation",
      ],
      github: "https://github.com/nishuR31/mathematicsForAll",
      demo: "https://mathematics-for-all.vercel.app",
    },
    {
      id: 7,
      title: "Nmoh",
      description: "A small warehouse for our team",
      image: "/projects/project-7.webp",
      technologies: ["Nodejs", "React", "JavaScript", "TailwindCSS", "Animation"],
      github: "https://github.com/nishuR31/nmoh",
      demo: "https://nmoh.vercel.app",
    },
    {
      id: 8,
      title: "Scafe",
      description: "A menu based website for Scafe for Mr. Gaurav Sahu",
      image: "/projects/project-8.webp",
      technologies: [
        "Nodejs",
        "React",
        "ImgBB",
        "Redis",
        "Bullmq",
        "MVCP",
        "JavaScript",
        "TailwindCSS",
        "Animation",
      ],
      github: "https://github.com/nishuR31/scafe",
      demo: "https://scafeakasahu.vercel.app",
    },
  ],
  skills: [
    {
      title: "Frontend",
      iconKey: "frontend",
      description: "Modern web interfaces",
      bgClass: "bg-blue-500/10",
      iconClass: "text-blue-500",
      skills: [
        { name: "React", level: "Intermediate" },
        { name: "HTML", level: "Intermediate" },
        { name: "TailwindCSS", level: "Advanced" },
        { name: "JavaScript", level: "Advanced", hot: true },
        { name: "TypeScript", level: "Intermediate", hot: true },
      ],
    },
    {
      title: "Backend",
      iconKey: "backend",
      description: "APIs, architecture, and auth",
      bgClass: "bg-emerald-500/10",
      iconClass: "text-emerald-500",
      skills: [
        { name: "Node.js", level: "Advanced", hot: true },
        { name: "Express.js", level: "Advanced", hot: true },
        { name: "Fastify", level: "Advanced", hot: true },
        { name: "Fastapi", level: "Beginner" },
        { name: "Queueing", level: "Intermediate" },
        { name: "REST APIs", level: "Advanced" },
        { name: "MVC Architecture", level: "Advanced", hot: true },
        { name: "JWT Authentication", level: "Advanced", hot: true },
        { name: "Mongoose", level: "Intermediate" },
        { name: "Prisma", level: "Intermediate", hot: true },
        { name: "Error Handling", level: "Advanced" },
      ],
    },
    {
      title: "Databases & Tools",
      iconKey: "tools",
      description: "Data and workflow stack",
      bgClass: "bg-orange-500/10",
      iconClass: "text-orange-500",
      skills: [
        { name: "MongoDB", level: "Intermediate", hot: true },
        { name: "MySQL", level: "Intermediate" },
        { name: "Postman", level: "Advanced", hot: true },
        { name: "Git", level: "Intermediate" },
        { name: "GitHub", level: "Advanced" },
        { name: "VS Code", level: "Advanced" },
        { name: "Antigravity", level: "Advanced", hot: true },
        { name: "Python", level: "Intermediate" },
        { name: "SQL", level: "Intermediate" },
      ],
    },
    {
      title: "Other Tools & Hands of Knowledge",
      iconKey: "terminal",
      description: "Other Tools",
      bgClass: "bg-red-500/10",
      iconClass: "text-red-500",
      skills: [
        { name: "Asp.Net", level: "Beginner" },
        { name: "Php", level: "Beginner" },
        { name: "Termux", level: "Beginner", hot: true },
        { name: "Data Communication", level: "Beginner", hot: true },
      ],
    },
  ],
  experiences: [
    {
      position: "Backend Development Practice",
      company: "Self-driven Engineering Track",
      period: "Ongoing",
      location: "Remote",
      description:
        "Building production-structured backend systems with modular architecture, secure auth, and scalable API workflows.",
      responsibilities: [
        "Architected RESTful APIs using modular MVC structure and layered middleware pipelines",
        "Implemented secure authentication flows using JWT, cookies, and protected route authorization",
        "Designed centralized error-handling utilities to improve API reliability and debugging efficiency",
        "Optimized API testing workflows and request validation using Postman collections",
        "Applied Git-based version control strategies for scalable project structuring",
      ],
      technologies: ["Node.js", "Express", "JWT", "MongoDB", "Postman", "Git"],
    },
    /*{
      position: "B.Tech Computer Science Engineering",
      company: "ICFAI University Jharkhand",
      period: "2023 - 2027",
      location: "Jharkhand, India",
      description:
        "Undergraduate engineering program with focus on software engineering, system design, data structures, and backend development.",
      responsibilities: [
        "Focused on core computer science and software engineering principles",
        "Applied OOP and data structure concepts in practical projects",
        "Built multiple backend and full-stack projects with scalable architecture",
      ],
      technologies: [
        "Data Structures",
        "OOP",
        "JavaScript",
        "TypeScript",
        "Node.js",
      ],
    },*/
  ],
  contactInfo: [
    {
      iconKey: "github",
      label: "GitHub",
      value: "@nishuR31",
      link: `https://github.com/nishuR31`,
    },
    {
      iconKey: "mail",
      label: "Email",
      value: "nishan.developer.dev@gmail.com",
      link: "mailto:nishan.developer.dev@gmail.com",
    },
    {
      iconKey: "map-pin",
      label: "Location",
      value: "Raghunathpur, West Bengal",
      link: null,
    },
    /*{
      iconKey: "briefcase",
      label: "LinkedIn",
      value: "linkedin.com/in/nishan-rajak-98b2ab3b8",
      link: "https://linkedin.com/in/nishan-rajak-98b2ab3b8",
    },*/
  ],
  certificates: [
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Comprehensive%20JavaScript%20Course%20From%20Beginner%20to%20Full%20Stack%20Pro.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Full%20Stack%20Web%20Development%20Bootcamp%20(HTML,%20CSS,%20JavaScript,jQuery,%20Web%20Templates,%20PHP,%20MySQL,MySQLi,%20with%20Source%20Code).pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/git.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/certificate-zn269pmhqc4t-1773898986.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/htmlForBiginners.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Introduction%20to%20Python.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/JavaScript%20Functions%20&%20Arrays%20in%20JavaScript.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/JavaScript%20Getting%20Started%20with%20JavaScript%20Programming.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/js%20array%20func.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/js%20from%20scratch.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Learn%20JavaScript%20Basics%20in%20Under%206%20Hours.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Learn%20Javascript%20Programming%20Language%20With%20Practical%20Interaction.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Learn%20the%20Basics%20of%20HTML%20and%20CSS%20and%20get%20Started%20with%20Web%20Design.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Level%20up%20your%20skills%20in%20HTML%20and%20CSS%20,%20learn%20how%20to%20create%20responsive%20web%20templates%20pt3.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/12.png",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/A%20Comprehensive%20Guide%20to%20HTML%20Online%20Course.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/MySQL%20Database%20Development%20Introduction.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Nishan%20-%20Participation%20Certificate.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Nishan%20sql.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Picsart_25-05-17_14-08-00-215.png",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/prompting.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Python%20Clean%20Coding.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Python%20dev%20first%20step.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/python.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Python%20Development%20Essentials%20course%20by%20MTF%20Institute.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Start%20Your%20Career%20With%20Python.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/tsc.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Upgrade%20your%20HTML%20&%20CSS%20conception%20and%20start%20building%20awesome%20templates%20pt2.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/website%20portfolio%20using%20gpt.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/WebDevSeminar.pdf",
    },
  ],
  additionalProjects: [
    "FocusMode — Productivity interface",
    "GitHub Recap Tool — Data summarization utility",
    "HBday — Cron-based email automation",
    "Gitignore Generator — Developer utility tool",
    "Interruption — Focus tracking system",
    "ProjectNexus — Modular backend architecture experiment",
    "SportsSpirit — TypeScript project",
  ],
  strengths: [
    "System architecture thinking",
    "Clean code practices",
    "API design and optimization",
    "Analytical problem-solving",
  ],
};

export default config;
export type Config = typeof config;
