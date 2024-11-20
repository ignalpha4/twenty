import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'class-validator';

import { FeatureStripeLookupKey } from 'src/engine/core-modules/billing/enums/feature-stripe-lookup-key.enum';
import { SubscriptionStatus } from 'src/engine/core-modules/billing/enums/subcription-status.enum';
import { BillingSubscriptionService } from 'src/engine/core-modules/billing/services/billing-subscription.service';
import { EnvironmentService } from 'src/engine/core-modules/environment/environment.service';
import { FeatureFlagKey } from 'src/engine/core-modules/feature-flag/enums/feature-flag-key.enum';
import { FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';

@Injectable()
export class BillingService {
  protected readonly logger = new Logger(BillingService.name);
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly billingSubscriptionService: BillingSubscriptionService,
    private readonly isFeatureEnabledService: FeatureFlagService,
  ) {}

  isBillingEnabled() {
    return this.environmentService.get('IS_BILLING_ENABLED');
  }

  async hasWorkspaceActiveSubscriptionOrFreeAccess(workspaceId: string) {
    const isBillingEnabled = this.isBillingEnabled();

    if (!isBillingEnabled) {
      return true;
    }

    const isFreeAccessEnabled =
      await this.isFeatureEnabledService.isFeatureEnabled(
        FeatureFlagKey.IsFreeAccessEnabled,
        workspaceId,
      );

    if (isFreeAccessEnabled) {
      return true;
    }

    const currentBillingSubscription =
      await this.billingSubscriptionService.getCurrentBillingSubscriptionOrThrow(
        { workspaceId },
      );

    return (
      isDefined(currentBillingSubscription) &&
      [
        SubscriptionStatus.Active,
        SubscriptionStatus.Trialing,
        SubscriptionStatus.PastDue,
      ].includes(currentBillingSubscription.status)
    );
  }

  async verifyWorkspaceEntitlement(
    workspaceId: string,
    entitlementKey: FeatureStripeLookupKey,
  ) {
    const isBillingEnabled = this.isBillingEnabled();

    if (!isBillingEnabled) {
      return true;
    }

    return this.billingSubscriptionService.getWorkspaceEntitlementByKey(
      workspaceId,
      entitlementKey,
    );
  }
}
