import * as SIM from 'simulation.simulation';
import Ev3 from 'simulation.robot.ev3';
/**
 * Creates a new robot for a simulation.
 *
 * This robot is a differential drive Volksbot. It has two wheels directly
 * connected to motors and several sensors. Each component of the robot has
 * a position in the robots coordinate system. The robot itself has a pose
 * in the global coordinate system (x, y, theta).
 *
 * @class
 */
function Volksbot(pose, configuration, num, robotBehaviour, img) {
    Ev3.call(this, pose, configuration, num, robotBehaviour);
    this.trackwidth = 120;
    this.wheelDiameter = 12;
    this.maxRotations = 1;
    this.maxPower = this.wheelDiameter * Math.PI * this.maxRotations * 0.03;
    this.img = img;
    this.geom = {
        x: -60,
        y: -30,
        w: this.trackwidth,
        h: 120,
        radius: 2.5,
        color: 'LIGHTGREY',
    };
    this.touchSensor = null;
    this.frontLeft = {
        x: 60,
        y: -30,
        rx: 0,
        ry: 0,
        bumped: false,
    };
    this.frontRight = {
        x: -60,
        y: -30,
        rx: 0,
        ry: 0,
        bumped: false,
    };
    this.wheelLeft = {
        x: 48,
        y: -15,
        w: 12,
        h: this.wheelDiameter * 3,
        color: '#000000',
    };
    this.wheelRight = {
        x: -60,
        y: -15,
        w: 12,
        h: this.wheelDiameter * 3,
        color: '#000000',
    };
    this.wheelBack = {
        x: -2.5,
        y: 30,
        w: 5,
        h: 5,
        color: '#000000',
    };
    this.led = null;
    for (var s in this.touchSensor) {
        this.touchSensor[s].color = 'LIGHTGREY';
    }
    this.colorRange = ['#000000', '#0057a6', '#00642e', '#00ff00', '#585858', '#800080', '#b30006', '#dc143c', '#ee82ee', '#f7d117', '#ff00ff', '#ffa500'];
    this.mouse = {
        x: 0,
        y: 30,
        rx: 0,
        ry: 0,
        r: 60,
    };
    this.timer = {
        timer1: false,
    };
}

Volksbot.prototype = Object.create(Ev3.prototype);
Volksbot.prototype.constructor = Volksbot;

Volksbot.prototype.reset = function () {
    this.encoder.left = 0;
    this.encoder.right = 0;
    for (var key in this.timer) {
        this.timer[key] = 0;
    }
    var robot = this;
};

/**
 * Update all actions of the Volksbot. The new pose is calculated with the
 * forward kinematics equations for a differential drive Volksbot.
 *
 * @param {actions}
 *            actions from the executing program: power for left and right
 *            motors/wheels, display, led ...
 *
 */
Volksbot.prototype.update = function () {
    var motors = this.robotBehaviour.getActionState('motors', true);
    if (motors) {
        var left = motors.c;
        if (left !== undefined) {
            if (left > 100) {
                left = 100;
            } else if (left < -100) {
                left = -100;
            }
            this.left = left * this.maxPower;
        }
        var right = motors.b;
        if (right !== undefined) {
            if (right > 100) {
                right = 100;
            } else if (right < -100) {
                right = -100;
            }
            this.right = right * this.maxPower;
        }
    }
    var tempRight = this.right;
    var tempLeft = this.left;
    this.pose.theta = (this.pose.theta + 2 * Math.PI) % (2 * Math.PI);
    this.encoder.left += this.left * SIM.getDt();
    this.encoder.right += this.right * SIM.getDt();
    var encoder = this.robotBehaviour.getActionState('encoder', true);
    if (encoder) {
        if (encoder.leftReset) {
            this.encoder.left = 0;
        }
        if (encoder.rightReset) {
            this.encoder.right = 0;
        }
    }
    if (this.frontLeft.bumped && this.left > 0) {
        tempLeft *= -1;
    }
    if (this.backLeft.bumped && this.left < 0) {
        tempLeft *= -1;
    }
    if (this.frontRight.bumped && this.right > 0) {
        tempRight *= -1;
    }
    if (this.backRight.bumped && this.right < 0) {
        tempRight *= -1;
    }
    if (tempRight == tempLeft) {
        var moveXY = tempRight * SIM.getDt();
        var mX = Math.cos(this.pose.theta) * moveXY;
        var mY = Math.sqrt(Math.pow(moveXY, 2) - Math.pow(mX, 2));
        this.pose.x += mX;
        if (moveXY >= 0) {
            if (this.pose.theta < Math.PI) {
                this.pose.y += mY;
            } else {
                this.pose.y -= mY;
            }
        } else {
            if (this.pose.theta > Math.PI) {
                this.pose.y += mY;
            } else {
                this.pose.y -= mY;
            }
        }
        this.pose.thetaDiff = 0;
    } else {
        this.frontLeft.bumped = false;
        this.frontRight.bumped = false;
        var R = (this.trackwidth / 2) * ((tempLeft + tempRight) / (tempLeft - tempRight));
        var rot = (tempLeft - tempRight) / this.trackwidth;
        var iccX = this.pose.x - R * Math.sin(this.pose.theta);
        var iccY = this.pose.y + R * Math.cos(this.pose.theta);
        this.pose.x = Math.cos(rot * SIM.getDt()) * (this.pose.x - iccX) - Math.sin(rot * SIM.getDt()) * (this.pose.y - iccY) + iccX;
        this.pose.y = Math.sin(rot * SIM.getDt()) * (this.pose.x - iccX) + Math.cos(rot * SIM.getDt()) * (this.pose.y - iccY) + iccY;
        this.pose.thetaDiff = rot * SIM.getDt();
        this.pose.theta = this.pose.theta + this.pose.thetaDiff;
    }
    var sin = Math.sin(this.pose.theta);
    var cos = Math.cos(this.pose.theta);
    this.frontRight = this.translate(sin, cos, this.frontRight);
    this.frontLeft = this.translate(sin, cos, this.frontLeft);
    this.backRight = this.translate(sin, cos, this.backRight);
    this.backLeft = this.translate(sin, cos, this.backLeft);
    this.backMiddle = this.translate(sin, cos, this.backMiddle);

    for (var s in this.colorSensor) {
        this.colorSensor[s] = this.translate(sin, cos, this.colorSensor[s]);
    }
    for (var s in this.ultraSensor) {
        this.ultraSensor[s] = this.translate(sin, cos, this.ultraSensor[s]);
    }
    this.mouse = this.translate(sin, cos, this.mouse);

    //update led(s)
    var led = this.robotBehaviour.getActionState('led', true);
    if (led) {
        switch (led.mode) {
            case 'off':
                this.ledSensor.color = '';
                break;
            case 'on':
                this.ledSensor.color = led.color.toUpperCase();
                break;
        }
    }
    // update display
    var display = this.robotBehaviour.getActionState('display', true);
    if (display) {
        if (display.text) {
            $('#display').html($('#display').html() + '<text x=' + display.x * 1.5 + ' y=' + display.y * 12 + '>' + display.text + '</text>');
        }
        if (display.picture) {
            $('#display').html(this.display[display.picture]);
        }
        if (display.clear) {
            $('#display').html('');
        }
    }
    // update tone
    var volume = this.robotBehaviour.getActionState('volume', true);
    if ((volume || volume === 0) && this.webAudio.context) {
        this.webAudio.volume = volume / 100.0;
    }
    var tone = this.robotBehaviour.getActionState('tone', true);
    if (tone && this.webAudio.context) {
        var cT = this.webAudio.context.currentTime;
        if (tone.frequency && tone.duration > 0) {
            var oscillator = this.webAudio.context.createOscillator();
            oscillator.type = 'square';
            oscillator.connect(this.webAudio.context.destination);
            var that = this;

            function oscillatorFinish() {
                that.tone.finished = true;
                oscillator.disconnect(that.webAudio.context.destination);
                //delete oscillator;
            }
            oscillator.onended = function (e) {
                oscillatorFinish();
            };
            oscillator.frequency.value = tone.frequency;
            oscillator.start(cT);
            oscillator.stop(cT + tone.duration / 1000.0);
        }
        if (tone.file !== undefined) {
            this.tone.file[tone.file](this.webAudio);
        }
    }
    // update timer
    var timer = this.robotBehaviour.getActionState('timer', false);
    if (timer) {
        for (var key in timer) {
            if (timer[key] == 'reset') {
                this.timer[key] = 0;
            }
        }
    }
};

export default Volksbot;
