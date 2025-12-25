/**
 * Sentient Observer - SSE Stream Handlers
 */

export class StreamManager {
    constructor(options = {}) {
        this.statusStream = null;
        this.momentStream = null;
        this.isConnected = false;
        
        this.onStatusUpdate = options.onStatusUpdate || (() => {});
        this.onMoment = options.onMoment || (() => {});
        this.onConnected = options.onConnected || (() => {});
        this.onDisconnected = options.onDisconnected || (() => {});
        
        this.lastMomentTime = {};
    }
    
    connectStatusStream() {
        if (this.statusStream) {
            this.statusStream.close();
        }
        
        this.statusStream = new EventSource('/stream/status');
        
        this.statusStream.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === 'status') {
                    this.onStatusUpdate(data.data);
                }
            } catch (err) {
                console.error('Status stream parse error:', err);
            }
        };
        
        this.statusStream.onopen = () => {
            this.isConnected = true;
            this.onConnected();
        };
        
        this.statusStream.onerror = () => {
            this.isConnected = false;
            this.onDisconnected();
            setTimeout(() => this.connectStatusStream(), 3000);
        };
    }
    
    connectMomentStream() {
        if (this.momentStream) {
            this.momentStream.close();
        }
        
        this.momentStream = new EventSource('/stream/moments');
        
        this.momentStream.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === 'moment') {
                    const moment = data.data;
                    const now = Date.now();
                    
                    // Throttle by trigger type
                    const lastTime = this.lastMomentTime[moment.trigger] || 0;
                    if (now - lastTime < 5000) {
                        return;
                    }
                    
                    this.lastMomentTime[moment.trigger] = now;
                    this.onMoment(moment);
                }
            } catch (err) {
                console.error('Moment stream parse error:', err);
            }
        };
    }
    
    connect() {
        this.connectStatusStream();
        this.connectMomentStream();
    }
    
    disconnect() {
        if (this.statusStream) {
            this.statusStream.close();
            this.statusStream = null;
        }
        if (this.momentStream) {
            this.momentStream.close();
            this.momentStream = null;
        }
        this.isConnected = false;
    }
}