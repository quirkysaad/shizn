const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidDialer(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const mainApplication = manifest.application[0];
    const mainActivity = mainApplication.activity.find((a) =>
      a["intent-filter"]?.some((f) =>
        f.action?.some(
          (ac) => ac.$["android:name"] === "android.intent.action.MAIN",
        ),
      ),
    );

    if (!mainActivity) {
      console.warn("withAndroidDialer: Could not find MainActivity");
      return config;
    }

    // 1. Add tools namespace for override support
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    // Ensure MainActivity shows on lock screen
    mainActivity.$["android:showWhenLocked"] = "true";
    mainActivity.$["android:turnScreenOn"] = "true";

    // 2. Add Dialer Intent Filters to MainActivity
    if (!mainActivity["intent-filter"]) {
      mainActivity["intent-filter"] = [];
    } else if (!Array.isArray(mainActivity["intent-filter"])) {
      mainActivity["intent-filter"] = [mainActivity["intent-filter"]];
    }

    const dialerFilters = [
      {
        action: [{ $: { "android:name": "android.intent.action.DIAL" } }],
        category: [
          { $: { "android:name": "android.intent.category.DEFAULT" } },
        ],
      },
      {
        action: [{ $: { "android:name": "android.intent.action.DIAL" } }],
        category: [
          { $: { "android:name": "android.intent.category.DEFAULT" } },
        ],
        data: [{ $: { "android:scheme": "tel" } }],
      },
      {
        action: [
          { $: { "android:name": "android.intent.action.VIEW" } },
          { $: { "android:name": "android.intent.action.DIAL" } },
        ],
        category: [
          { $: { "android:name": "android.intent.category.DEFAULT" } },
          { $: { "android:name": "android.intent.category.BROWSABLE" } },
        ],
        data: [{ $: { "android:scheme": "tel" } }],
      },
    ];

    dialerFilters.forEach((newFilter) => {
      const exists = mainActivity["intent-filter"].some((existingFilter) => {
        const sameAction = existingFilter.action?.some(
          (ac) =>
            ac.$["android:name"] === newFilter.action[0].$["android:name"],
        );
        const sameData =
          (!existingFilter.data && !newFilter.data) ||
          existingFilter.data?.some(
            (d) =>
              d.$["android:scheme"] ===
              newFilter.data?.[0]?.$["android:scheme"],
          );
        return sameAction && sameData;
      });

      if (!exists) {
        mainActivity["intent-filter"].push(newFilter);
      }
    });

    // 2b. Add autoRevokePermissions to mainApplication to prevent pausing app activity
    mainApplication.$["android:autoRevokePermissions"] = "disallowed";

    // 3. Ensure AppInCallService is correctly overridden
    if (!mainApplication.service) mainApplication.service = [];
    if (!Array.isArray(mainApplication.service))
      mainApplication.service = [mainApplication.service];

    const serviceName = "expo.modules.callmodule.AppInCallService";
    let existingService = mainApplication.service.find(
      (s) => s.$["android:name"] === serviceName,
    );

    if (!existingService) {
      existingService = {
        $: {
          "android:name": serviceName,
          "android:permission": "android.permission.BIND_INCALL_SERVICE",
          "android:exported": "true",
          "android:directBootAware": "true",
          "tools:replace": "android:exported",
        },
        "meta-data": [
          {
            $: {
              "android:name": "android.telecom.IN_CALL_SERVICE_UI",
              "android:value": "true",
            },
          },
        ],
        "intent-filter": [
          {
            action: [
              { $: { "android:name": "android.telecom.InCallService" } },
            ],
          },
        ],
      };
      mainApplication.service.push(existingService);
    } else {
      existingService.$["tools:replace"] = "android:exported";
      existingService.$["android:exported"] = "true";
    }

    // 4. Ensure CallActionReceiver is correctly overridden
    if (!mainApplication.receiver) mainApplication.receiver = [];
    if (!Array.isArray(mainApplication.receiver))
      mainApplication.receiver = [mainApplication.receiver];

    const receiverName = "expo.modules.callmodule.CallActionReceiver";
    let existingReceiver = mainApplication.receiver.find(
      (r) => r.$["android:name"] === receiverName,
    );

    if (!existingReceiver) {
      existingReceiver = {
        $: {
          "android:name": receiverName,
          "android:exported": "true",
          "tools:replace": "android:exported",
        },
      };
      mainApplication.receiver.push(existingReceiver);
    } else {
      existingReceiver.$["tools:replace"] = "android:exported";
      existingReceiver.$["android:exported"] = "true";
    }

    return config;
  });
};
