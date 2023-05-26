import {
    System,
    BaseModule,
    ModuleScreen,
    IModuleChannel,
    Message,
    logger,
    ModuleScreenProps,
    ModuleService,
} from 'dart-api';
import DatabaseManager from './utils/DatabaseManager';
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CircularProgress } from '@mui/material';
import { TCPClientState } from './type';
import { VisionSettings } from './components/VisionSettings';

//PIP Screen 및 Sub Program 제작용
import PipScreenForTaskEditor from './UserCommandScreen/DetectionPIPscreen';
import { ServiceForTaskEditor } from './UserCommandService/DetectionService';
import { messages } from './messages';
// IIFE for register a function to create an instance of main class which is inherited BaseModule.
(() => {
    System.registerModuleMainClassCreator((packageInfo) => new Module(packageInfo));
})();
class Module extends BaseModule {
    getModuleScreen(componentId: string) {
        if (componentId === 'MainScreen') {
            //Main screen
            return MainScreen;
        } else if (componentId === 'pip_detection') {
            //PIP Screen
            return PipScreenForTaskEditor;
        }
        return null;
    }
    // Return Sub Program
    getModuleService(componentId: string): typeof ModuleService | null {
        if (componentId === 'pip_detection') {
            return ServiceForTaskEditor;
        }
        return null;
    }
}
class MainScreen extends ModuleScreen {
    readonly context = this.moduleContext;
    constructor(props: ModuleScreenProps) {
        super(props);
        this.state = {
            isDatabaseInitialized: false,
        };
    }
    async componentDidMount() {
        logger.debug(`componentDidMount: ${this.moduleContext.componentId}`);
        try {
            await DatabaseManager.initDatabase(this.moduleContext);
            this.setState({
                isDatabaseInitialized: true,
            });
        } catch (error) {
            // handle error
        }
    }
    componentDidUpdate(_prevProps: Readonly<Record<string, unknown>>, prevState: Readonly<TCPClientState>): void {}
    componentWillUnmount() {}
    onBind(message: Message, channel: IModuleChannel): boolean {
        return false;
    }
    onUnbind(message: Message) {}
    render() {
        const { isDatabaseInitialized } = this.state;
        if (!isDatabaseInitialized) {
            return (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                    }}
                >
                    <CircularProgress />
                </div>
            );
        } else {
            return (
                <ThemeProvider theme={this.systemTheme}>
                    <VisionSettings moduleContext={this.moduleContext} />
                </ThemeProvider>
            );
        }
    }
}
