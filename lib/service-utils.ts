export const isPreviewFeatureEnabled = (
  feature: string,
  email: string = '',
): boolean => {
  if (!process.env.NEXT_PUBLIC_PREVIEW_FEATURES) {
    return false
  }

  feature = feature.toLowerCase()
  email = email?.toLowerCase()
  const publicPreviewFeatures =
    process.env.NEXT_PUBLIC_PREVIEW_FEATURES?.toLowerCase()

  // features are stored as a comma-delimited list of key-value pairs
  //    e.g. Foo,Bar
  //    e.g. Foo=test@polyverse.com,Bar=@polyverse.com

  // first grab the list of features (key/value or key only) that are enabled
  const featuresEnabled = publicPreviewFeatures.split(',')

  if (featuresEnabled.includes(feature)) {
    console.log(
      `[${process.env.SARA_STAGE} Deployment] Preview Feature: ${feature} = ENABLED for all users`,
    )
    return true
  }

  try {
    // now check if the feature is enabled for the current user
    const featureEnabled = featuresEnabled.some((f) => {
      const [featureKey, emailValue] = f.split('=')

      if (featureKey === feature) {
        if (!emailValue) {
          // if the feature is enabled for all users, return true
          console.log(
            `[${process.env.SARA_STAGE} Deployment] Preview Feature: ${feature} = ENABLED for all users`,
          )
          return true
        }

        // if the feature is enabled for a specific user, check if the current user matches
        if (emailValue === email) {
          console.log(
            `[${process.env.SARA_STAGE} Deployment] Preview Feature: ${feature} = ENABLED for ${email}`,
          )
          return true
        } else if (emailValue.includes('@') && email.includes('@')) {
          // if the feature is enabled for a domain, check if the current user's email domain matches
          const domain = email.split('@')[1] || ''
          if (emailValue === `@${domain}`) {
            console.log(
              `[${process.env.SARA_STAGE} Deployment] Preview Feature: ${feature} = ENABLED for @${domain}`,
            )
            return true
          }
        }
      }

      return false
    })

    if (!featureEnabled) {
      console.log(
        `[${process.env.SARA_STAGE} Deployment] Preview Feature: ${feature} = DISABLED`,
      )
    }

    return featureEnabled
  } catch (error) {
    console.error(
      `Error checking if preview feature ${feature} for ${email} with ${process.env.NEXT_PUBLIC_PREVIEW_FEATURES} is enabled: ${error}`,
    )
    return false
  }
}
