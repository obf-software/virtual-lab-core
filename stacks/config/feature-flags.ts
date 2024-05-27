const enum FeatureFlag {
    READABLE_LOG_FORMAT,
    RETAIN_USER_POOL_ON_DELETE,
    USER_POOL_IDENTITY_PROVIDER,
    USER_POOL_SELF_SIGN_UP,
    NEW_RELIC_LAMBDA_INSTRUMENTATION,
}

const featureFlagToDefaultValueMap: Record<keyof typeof FeatureFlag, boolean> = {
    READABLE_LOG_FORMAT: false,
    RETAIN_USER_POOL_ON_DELETE: true,
    USER_POOL_IDENTITY_PROVIDER: false,
    USER_POOL_SELF_SIGN_UP: true,
    NEW_RELIC_LAMBDA_INSTRUMENTATION: false,
};

export const featureFlagIsEnabled = (input: {
    featureFlag: keyof typeof featureFlagToDefaultValueMap;
    components?: string[];
    forceEnable?: boolean;
    forceDisable?: boolean;
}) => {
    if (input.forceEnable && input.forceDisable) {
        throw new Error('Cannot force enable and force disable a feature flag at the same time.');
    }

    const featureFlagDefaultValue = featureFlagToDefaultValueMap[input.featureFlag];
    const rawFeatureFlagValue = process.env[input.featureFlag] ?? '';

    let featureFlagValue = featureFlagDefaultValue;
    let usingDefaultValue = true;

    const truthyValues = ['true', '1', 'yes', 'on'];
    const falsyValues = ['false', '0', 'no', 'off'];

    if (truthyValues.includes(rawFeatureFlagValue)) {
        featureFlagValue = true;
        usingDefaultValue = false;
    } else if (falsyValues.includes(rawFeatureFlagValue)) {
        featureFlagValue = false;
        usingDefaultValue = false;
    }

    if (input.forceEnable) {
        featureFlagValue = true;
        usingDefaultValue = false;
    } else if (input.forceDisable) {
        featureFlagValue = false;
        usingDefaultValue = false;
    }

    if (
        rawFeatureFlagValue !== '' &&
        !truthyValues.includes(rawFeatureFlagValue) &&
        !falsyValues.includes(rawFeatureFlagValue)
    ) {
        console.warn(
            `[FEATURE FLAG] "${input.featureFlag}" has an invalid value: "${rawFeatureFlagValue}"`,
        );
    }

    const onOff = featureFlagValue ? 'ON' : 'OFF';
    const isUsingDefaultValue = usingDefaultValue ? ' (DEFAULT VALUE)' : '';
    const forced = input.forceEnable ?? input.forceDisable ? ' (FORCED)' : '';
    const enablingOrDisabling = featureFlagValue ? 'Enabling' : 'Disabling';

    input.components?.forEach((component) => {
        console.log(
            `[FEATURE FLAG] "${input.featureFlag}": ${onOff}${isUsingDefaultValue}${forced}. ${enablingOrDisabling} "${component}"`,
        );
    });

    return featureFlagValue;
};
