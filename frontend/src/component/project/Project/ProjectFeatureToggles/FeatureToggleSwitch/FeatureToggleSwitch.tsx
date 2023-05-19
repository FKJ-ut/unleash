import { useCallback, useState, VFC } from 'react';
import { Box, styled } from '@mui/material';
import PermissionSwitch from 'component/common/PermissionSwitch/PermissionSwitch';
import { UPDATE_FEATURE_ENVIRONMENT } from 'component/providers/AccessProvider/permissions';
import { useOptimisticUpdate } from './hooks/useOptimisticUpdate';
import { flexRow } from 'themes/themeStyles';
import { ENVIRONMENT_STRATEGY_ERROR } from 'constants/apiErrors';
import { formatUnknownError } from 'utils/formatUnknownError';
import useFeatureApi from 'hooks/api/actions/useFeatureApi/useFeatureApi';
import { useFeature } from 'hooks/api/getters/useFeature/useFeature';
import useToast from 'hooks/useToast';
import { useChangeRequestsEnabled } from 'hooks/useChangeRequestsEnabled';
import { useChangeRequestToggle } from 'hooks/useChangeRequestToggle';
import { EnableEnvironmentDialog } from 'component/feature/FeatureView/FeatureOverview/FeatureOverviewSidePanel/FeatureOverviewSidePanelEnvironmentSwitches/FeatureOverviewSidePanelEnvironmentSwitch/EnableEnvironmentDialog';
import { UpdateEnabledMessage } from 'component/changeRequest/ChangeRequestConfirmDialog/ChangeRequestMessages/UpdateEnabledMessage';
import { ChangeRequestDialogue } from 'component/changeRequest/ChangeRequestConfirmDialog/ChangeRequestConfirmDialog';

const StyledBoxContainer = styled(Box)<{ 'data-testid': string }>(() => ({
    mx: 'auto',
    ...flexRow,
}));

interface IFeatureToggleSwitchProps {
    featureId: string;
    environmentName: string;
    projectId: string;
    value: boolean;
    showInfoBox?: () => void;
    onToggle?: (
        projectId: string,
        feature: string,
        env: string,
        state: boolean
    ) => void;
}

export const FeatureToggleSwitch: VFC<IFeatureToggleSwitchProps> = ({
    projectId,
    featureId,
    environmentName,
    value,
    onToggle,
    showInfoBox,
}) => {
    const { toggleFeatureEnvironmentOn, toggleFeatureEnvironmentOff } =
        useFeatureApi();
    const { setToastData, setToastApiError } = useToast();
    const { isChangeRequestConfigured } = useChangeRequestsEnabled(projectId);
    const {
        onChangeRequestToggle,
        onChangeRequestToggleClose,
        onChangeRequestToggleConfirm,
        changeRequestDialogDetails,
    } = useChangeRequestToggle(projectId);
    const [isChecked, setIsChecked, rollbackIsChecked] =
        useOptimisticUpdate<boolean>(value);

    const [showEnabledDialog, setShowEnabledDialog] = useState(false);
    const { feature } = useFeature(projectId, featureId);

    const disabledStrategiesCount =
        feature?.environments
            .find(env => env.name === environmentName)
            ?.strategies.filter(strategy => strategy.disabled).length ?? 0;

    const callback = () => {
        onToggle &&
            onToggle(projectId, feature.name, environmentName, !isChecked);
    };

    const handleToggleEnvironmentOn = useCallback(
        async (shouldActivateDisabled = false) => {
            try {
                setIsChecked(!isChecked);
                await toggleFeatureEnvironmentOn(
                    projectId,
                    feature.name,
                    environmentName,
                    shouldActivateDisabled
                );
                setToastData({
                    type: 'success',
                    title: `Available in ${environmentName}`,
                    text: `${feature.name} is now available in ${environmentName} based on its defined strategies.`,
                });
                callback();
            } catch (error: unknown) {
                if (
                    error instanceof Error &&
                    error.message === ENVIRONMENT_STRATEGY_ERROR
                ) {
                    showInfoBox && showInfoBox();
                } else {
                    setToastApiError(formatUnknownError(error));
                }
                rollbackIsChecked();
            }
        },
        [
            rollbackIsChecked,
            setToastApiError,
            showInfoBox,
            setToastData,
            toggleFeatureEnvironmentOn,
            setIsChecked,
        ]
    );

    const handleToggleEnvironmentOff = useCallback(async () => {
        try {
            setIsChecked(!isChecked);
            await toggleFeatureEnvironmentOff(
                projectId,
                feature.name,
                environmentName
            );
            setToastData({
                type: 'success',
                title: `Unavailable in ${environmentName}`,
                text: `${feature.name} is unavailable in ${environmentName} and its strategies will no longer have any effect.`,
            });
            callback();
        } catch (error: unknown) {
            setToastApiError(formatUnknownError(error));
            rollbackIsChecked();
        }
    }, [
        toggleFeatureEnvironmentOff,
        setToastData,
        setToastApiError,
        rollbackIsChecked,
        setIsChecked,
    ]);

    const featureHasOnlyDisabledStrategies = useCallback(() => {
        const featureEnvironment = feature?.environments?.find(
            env => env.name === environmentName
        );
        return (
            featureEnvironment?.strategies &&
            featureEnvironment?.strategies?.length > 0 &&
            featureEnvironment?.strategies?.every(strategy => strategy.disabled)
        );
    }, [environmentName]);

    const onClick = useCallback(
        async (e: React.MouseEvent) => {
            if (isChangeRequestConfigured(environmentName)) {
                e.preventDefault();
                if (featureHasOnlyDisabledStrategies()) {
                    setShowEnabledDialog(true);
                } else {
                    onChangeRequestToggle(
                        feature.name,
                        environmentName,
                        !value,
                        false
                    );
                }
                return;
            }
            if (value) {
                await handleToggleEnvironmentOff();
                return;
            }

            if (featureHasOnlyDisabledStrategies()) {
                setShowEnabledDialog(true);
            } else {
                await handleToggleEnvironmentOn();
            }
        },
        [
            isChangeRequestConfigured,
            onChangeRequestToggle,
            handleToggleEnvironmentOff,
            setShowEnabledDialog,
        ]
    );

    const onActivateStrategies = useCallback(async () => {
        if (isChangeRequestConfigured(environmentName)) {
            onChangeRequestToggle(feature.name, environmentName, !value, true);
        } else {
            await handleToggleEnvironmentOn(true);
        }
        setShowEnabledDialog(false);
    }, [
        handleToggleEnvironmentOn,
        setShowEnabledDialog,
        isChangeRequestConfigured,
        onChangeRequestToggle,
    ]);

    const onAddDefaultStrategy = useCallback(async () => {
        if (isChangeRequestConfigured(environmentName)) {
            onChangeRequestToggle(feature.name, environmentName, !value, false);
        } else {
            await handleToggleEnvironmentOn();
        }
        setShowEnabledDialog(false);
    }, [
        isChangeRequestConfigured,
        onChangeRequestToggle,
        handleToggleEnvironmentOn,
    ]);

    const key = `${feature.name}-${environmentName}`;

    return (
        <>
            <StyledBoxContainer
                key={key} // Prevent animation when archiving rows
                data-testid={`TOGGLE-${key}`}
            >
                <PermissionSwitch
                    tooltip={
                        value
                            ? `Disable feature in ${environmentName}`
                            : `Enable feature in ${environmentName}`
                    }
                    checked={isChecked}
                    environmentId={environmentName}
                    projectId={projectId}
                    permission={UPDATE_FEATURE_ENVIRONMENT}
                    inputProps={{ 'aria-label': environmentName }}
                    onClick={onClick}
                    disabled={isChecked !== value}
                />
            </StyledBoxContainer>
            <EnableEnvironmentDialog
                isOpen={showEnabledDialog}
                onClose={() => setShowEnabledDialog(false)}
                environment={environmentName}
                disabledStrategiesCount={disabledStrategiesCount}
                onActivateDisabledStrategies={onActivateStrategies}
                onAddDefaultStrategy={onAddDefaultStrategy}
            />
            <ChangeRequestDialogue
                isOpen={changeRequestDialogDetails.isOpen}
                onClose={onChangeRequestToggleClose}
                environment={changeRequestDialogDetails?.environment}
                onConfirm={onChangeRequestToggleConfirm}
                messageComponent={
                    <UpdateEnabledMessage
                        enabled={changeRequestDialogDetails?.enabled!}
                        featureName={changeRequestDialogDetails?.featureName!}
                        environment={changeRequestDialogDetails.environment!}
                    />
                }
            />
        </>
    );
};
