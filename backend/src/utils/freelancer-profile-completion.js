/**
 * Helper to calculate the profile completion percentage (0-100%) for a Freelancer.
 *
 * @param {Object} user - User record with nested freelancerProfile, freelancerSkills, etc.
 * @returns {Object} { percent: number, missingCriteria: string[] }
 */
export const calculateFreelancerProfileCompletion = (user = {}) => {
  if (!user || typeof user !== "object") {
    return { percent: 0, missingCriteria: ["Profile details missing"] };
  }

  const profile = user.freelancerProfile || user.profileDetails || {};
  const skills = user.freelancerSkills || user.skills || [];

  const criteria = [
    {
      label: "Profile photo",
      weight: 10,
      isComplete: Boolean(user.avatar || profile.avatar)
    },
    {
      label: "Professional bio",
      weight: 15,
      isComplete: Boolean(
        (profile.professionalBio || profile.bio || "").trim().length >= 20
      )
    },
    {
      label: "Location (City & Country)",
      weight: 10,
      isComplete: Boolean((profile.city || user.city) && (profile.country || user.country))
    },
    {
      label: "Services selected",
      weight: 15,
      isComplete: Boolean(
        Array.isArray(profile.services) && profile.services.length > 0
      )
    },
    {
      label: "Skills & Tech Stack",
      weight: 15,
      isComplete: Boolean(
        (Array.isArray(skills) && skills.length > 0) ||
        (Array.isArray(profile.skills) && profile.skills.length > 0)
      )
    },
    {
      label: "Work experience or Education",
      weight: 15,
      isComplete: Boolean(
        (Array.isArray(profile.workExperience) && profile.workExperience.length > 0) ||
        (Array.isArray(profile.education) && profile.education.length > 0)
      )
    },
    {
      label: "Resume uploaded",
      weight: 10,
      isComplete: Boolean(profile.resume)
    },
    {
      label: "Policies accepted & Profile links",
      weight: 10,
      isComplete: Boolean(
        profile.deliveryPolicyAccepted && profile.communicationPolicyAccepted
      )
    }
  ];

  let rawScore = 0;
  let totalWeight = 0;
  const missingCriteria = [];

  for (const item of criteria) {
    totalWeight += item.weight;
    if (item.isComplete) {
      rawScore += item.weight;
    } else {
      missingCriteria.push(item.label);
    }
  }

  const percent = totalWeight > 0 ? Math.round((rawScore / totalWeight) * 100) : 0;

  return {
    percent: Math.min(100, Math.max(0, percent)),
    missingCriteria
  };
};
