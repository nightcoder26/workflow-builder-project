const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String },
    position: {
        x: { type: Number },
        y: { type: Number }
    },
    data: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    source: { type: String },
    target: { type: String },
    sourceHandle: { type: String },
    targetHandle: { type: String }
}, { _id: false });

const WorkflowSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 500 },
    nodes: { type: [NodeSchema], default: [] },
    edges: { type: [EdgeSchema], default: [] },
    isActive: { type: Boolean, default: false },
    isDraft: { type: Boolean, default: true },
    triggerType: { type: String, enum: ['polling', 'webhook', 'manual'], default: 'polling' },
    pollingInterval: { type: Number, default: 5, min: 1, max: 60 },
    totalExecutions: { type: Number, default: 0 },
    lastExecutedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 }
});

WorkflowSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    if (!this.isNew) {
        this.version = (this.version || 1) + 1;
    }
    next();
});

WorkflowSchema.index({ userId: 1, updatedAt: -1 });
WorkflowSchema.index({ isActive: 1 });

module.exports = mongoose.model('Workflow', WorkflowSchema);
