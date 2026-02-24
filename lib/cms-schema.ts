// CMS schema defining the structure of website content
// This provides fallback data when API is unavailable
export const cmsSchema = [
  {
    page: "home",
    section: "topbar",
    data: {
      enabled: true,
      phone: "+088 4584 6845 4578",
      email: "info@deardoc.com",
    },
  },
  {
    page: "home",
    section: "navbar",
    data: {
      enabled: true,
      logo: "https://demo.assets.templately.com/fitness/elementor/10/2024/03/3fe1ac74-group-21.png",
      items: [
        { id: "1", text: "Home", link: "/" },
        { id: "2", text: "About Me", link: "/about" },
        { id: "3", text: "Services", link: "/services" },
        { id: "4", text: "Testimonials", link: "/testimonials" },
        { id: "5", text: "Blog", link: "/blog" },
      ],
    },
  },
  {
    page: "home",
    section: "carousel",
    data: {
      enabled: true,
      slides: [
        {
          id: "slide1",
          headline_main: "Providing Quality Care with Patient",
          description:
            "This is a great site for everything around the home, and it also has a useful beauty section. You can see the best products in each category and they even have test results to back up the information they are giving you.",
          button_text: "Get Treatment",
          button_link: "/treatment",
          image:
            "https://demo.assets.templately.com/fitness/elementor/10/2024/03/ccbaeb30-group-83.png",
          availability_text: "Available 24/7",
          emergency_text: "Emergency Care",
        },
      ],
    },
  },
  {
    page: "home",
    section: "stats",
    data: {
      enabled: true,
      items: [
        {
          id: "1",
          number: "95",
          suffix: "%",
          title: "positive reviews",
          description: "from my satisfy client",
        },
        {
          id: "2",
          number: "2.4",
          suffix: "K",
          title: "questions and answers",
          description: "find answer to your questions",
        },
        {
          id: "3",
          number: "50",
          suffix: "+",
          title: "award winning",
          description: "most award winning",
        },
      ],
    },
  },
  {
    page: "home",
    section: "homepage_about",
    data: {
      enabled: true,
      subtitle: "Who I'm",
      title: "Hello my name is Nick Bejos",
      specialty: "Obstetrics & Gynaecology",
      description:
        "There are many variations of passages of Lorem Ipsum available, but the majority have suffered in some form, by injected humour, or randomised words which don't look even slightly believable.",
      image1:
        "https://demo.assets.templately.com/fitness/elementor/10/2024/03/7305caa5-group-96.png",
      features: [
        "Best Fitness Exercises",
        "Combine Fitness and Lifestyle",
        "Achieve a Specific Goal",
        "Emergency & express care services",
      ],
    },
  },
  {
    page: "home",
    section: "services",
    data: {
      enabled: true,
      subtitle: "Services",
      title: "I Offer a Whole Range of Medical Services",
      description:
        "This is a great site for everything around the home, and it also has a useful section. You can see the best products.",
      image:
        "https://demo.assets.templately.com/fitness/elementor/10/2024/03/ccbaeb30-group-83.png",
      items: [
        {
          id: "service1",
          title: "Doctor's Consultation",
          description:
            "Need a consultation regarding your treatment or diagnosis? I'm always ready to provide you with professional healthcare consulting that is offered at an affordable price.",
          features: [
            "Individual prescriptions",
            "Personalized medical consultations",
            "Choosing appropriate treatment options",
            "Detailed medical opinion",
            "Online medical consulting",
            "Diagnostic services",
            "Urgent medical consulting",
          ],
        },
      ],
    },
  },
  {
    page: "home",
    section: "testimonials",
    data: {
      enabled: true,
      title: "What my Patients Says",
      subtitle: "Testimonial",
      description:
        "This is a great site for everything around the home, and it also has a useful section. You can see the best products.",
      testimonials: [
        {
          id: "1",
          name: "Mathilde Langevin",
          title: "CEO at Apple",
          content:
            "Need a consultation regarding your treatment or diagnosis? I'm always ready to provide you with professional healthcare consulting that is offered at an affordable price. At MedoX, you can expect nothing less than the ultimate level of care.",
          image:
            "https://demo.assets.templately.com/fitness/elementor/10/2024/03/fac7f8ff-image-2.png",
        },
      ],
    },
  },
  {
    page: "home",
    section: "blog",
    data: {
      enabled: true,
      title: "My Insights & Articles",
      subtitle: "Blog Post",
      description:
        "This is a great site for everything around the home, and it also has a useful section. You can see the best products.",
      posts: [
        {
          id: "1",
          title: "Having overweight and depression can",
          excerpt:
            "This is a great site for everything around the home, and it also has a useful section. You can see the best products.",
          image:
            "https://demo.assets.templately.com/fitness/elementor/10/2021/06/b3d10ece-jeshoots-com-l0j0dhvwcie-unsplash-1.png",
          author: "Dr. Smith",
          date: "March 24, 2024",
          category: "Health Tips",
        },
      ],
    },
  },
  {
    page: "home",
    section: "footer",
    data: {
      enabled: true,
      logo: "https://demo.assets.templately.com/fitness/elementor/10/2024/03/3fe1ac74-group-21.png",
      description:
        "Providing compassionate and professional healthcare services with a focus on patient well-being and medical excellence.",
      socialLinks: [
        { name: "Facebook", url: "#", icon: "facebook" },
        { name: "Instagram", url: "#", icon: "instagram" },
        { name: "LinkedIn", url: "#", icon: "linkedin" },
        { name: "YouTube", url: "#", icon: "youtube" },
      ],
      services: [
        { name: "General Consultation", url: "/services/consultation" },
        { name: "Health Checkups", url: "/services/checkups" },
        { name: "Specialist Care", url: "/services/specialist" },
        { name: "Emergency Care", url: "/services/emergency" },
      ],
      quickLinks: [
        { name: "About Doctor", url: "/about" },
        { name: "Appointments", url: "/appointments" },
        { name: "Patient Reviews", url: "/reviews" },
        { name: "Health Blog", url: "/blog" },
      ],
      contact: [
        { icon: "phone", text: "+1 (555) 123-4567", url: "tel:+15551234567" },
        {
          icon: "email",
          text: "info@deardoc.com",
          url: "mailto:info@deardoc.com",
        },
        { icon: "location", text: "123 Medical Center, Health City", url: "#" },
        { icon: "clock", text: "Mon-Fri: 9AM-6PM", url: "#" },
      ],
      copyright: "© 2024 Dear Doc. All rights reserved.",
    },
  },
  {
    page: "home",
    section: "settings",
    data: {
      enabled: true,
      version: "v1",
      colorPalette: "blue",
      layoutOrder: [
        "topbar",
        "navbar",
        "carousel",
        "stats",
        "homepage_about",
        "services",
        "testimonials",
        "blog",
        "footer",
      ],
      fixedSections: ["topbar", "navbar", "footer"],
      availablePalettes: [
        {
          name: "blue",
          label: "Medical Blue",
          colors: ["#0F4C75", "#3282B8", "#16A085"],
        },
        {
          name: "red",
          label: "Medical Red",
          colors: ["#991B1B", "#DC2626", "#EF4444"],
        },
        {
          name: "green",
          label: "Medical Green",
          colors: ["#065F46", "#059669", "#10B981"],
        },
        {
          name: "purple",
          label: "Medical Purple",
          colors: ["#581C87", "#7C3AED", "#8B5CF6"],
        },
        {
          name: "orange",
          label: "Medical Orange",
          colors: ["#9A3412", "#EA580C", "#F97316"],
        },
      ],
      availableVersions: [
        { name: "v1", label: "Classic Style" },
        { name: "v2", label: "Modern Style" },
        { name: "v3", label: "Minimal Style" },
      ],
    },
  },
];