package de.fhg.iais.roberta.visitor.hardware;

import de.fhg.iais.roberta.syntax.action.raspberrypi.LedBlinkAction;
import de.fhg.iais.roberta.syntax.action.raspberrypi.LedDimAction;
import de.fhg.iais.roberta.syntax.action.raspberrypi.LedGetAction;
import de.fhg.iais.roberta.syntax.action.raspberrypi.LedSetAction;
import de.fhg.iais.roberta.syntax.lang.expr.ColorHexString;
import de.fhg.iais.roberta.syntax.lang.stmt.IntentStmt;
import de.fhg.iais.roberta.syntax.sensor.generic.KeysSensor;
import de.fhg.iais.roberta.syntax.sensors.raspberrypi.SlotSensor;
import de.fhg.iais.roberta.util.dbc.DbcException;
import de.fhg.iais.roberta.visitor.hardware.actor.ILightVisitor;
import de.fhg.iais.roberta.visitor.hardware.actor.ISpeechVisitor;
import de.fhg.iais.roberta.visitor.hardware.sensor.ISensorVisitor;

/**
 * Interface to be used with the visitor pattern to traverse an AST (and generate code, e.g.).
 */
public interface IRaspberryPiVisitor<V> extends ISpeechVisitor<V>, ISensorVisitor<V>, ILightVisitor<V> {

    public V visitColorHexString(ColorHexString<V> colorHexString);

    public V visitLedSetAction(LedSetAction<V> ledSetAction);

    public V visitLedBlinkAction(LedBlinkAction<V> ledBlinkAction);

    public V visitLedDimAction(LedDimAction<V> ledDimAction);

    public V visitLedGetAction(LedGetAction<V> ledGetAction);

    public V visitIntentStmt(IntentStmt<V> intentStmt);

    public V visitSlotSensor(SlotSensor<V> slotSensor);

}