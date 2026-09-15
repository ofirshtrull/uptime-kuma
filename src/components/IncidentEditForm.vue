<template>
    <div
        class="shadow-box alert mb-4 p-4 incident"
        role="alert"
        :class="'bg-' + modelValue.style"
        data-testid="incident-edit"
    >
        <strong>{{ $t("Title") }}:</strong>
        <Editable
            :model-value="modelValue.title"
            tag="h4"
            :contenteditable="true"
            :noNL="true"
            class="alert-heading"
            data-testid="incident-title"
            @update:model-value="updateField('title', $event)"
        />

        <strong>{{ $t("Content") }}:</strong>
        <Editable
            :model-value="modelValue.content"
            tag="div"
            :contenteditable="true"
            class="content"
            data-testid="incident-content-editable"
            @update:model-value="updateField('content', $event)"
        />
        <div class="form-text">
            {{ $t("markdownSupported") }}
        </div>

        <div class="mt-3">
            <button class="btn btn-light me-2" data-testid="post-incident-button" @click="$emit('post')">
                <font-awesome-icon icon="bullhorn" />
                {{ $t("Post") }}
            </button>

            <button class="btn btn-light me-2" @click="$emit('cancel')">
                <font-awesome-icon icon="times" />
                {{ $t("Cancel") }}
            </button>

            <div class="dropdown d-inline-block me-2">
                <button
                    :id="styleDropdownId"
                    class="btn btn-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    data-testid="incident-style-dropdown"
                    aria-expanded="false"
                >
                    {{ $t("Style") }}: {{ $t(modelValue.style) }}
                </button>
                <ul class="dropdown-menu" :aria-labelledby="styleDropdownId">
                    <li>
                        <button type="button" class="dropdown-item" @click="updateField('style', 'info')">
                            {{ $t("info") }}
                        </button>
                    </li>
                    <li>
                        <button type="button" class="dropdown-item" @click="updateField('style', 'warning')">
                            {{ $t("warning") }}
                        </button>
                    </li>
                    <li>
                        <button type="button" class="dropdown-item" @click="updateField('style', 'danger')">
                            {{ $t("danger") }}
                        </button>
                    </li>
                    <li>
                        <button type="button" class="dropdown-item" @click="updateField('style', 'primary')">
                            {{ $t("primary") }}
                        </button>
                    </li>
                    <li>
                        <button type="button" class="dropdown-item" @click="updateField('style', 'light')">
                            {{ $t("light") }}
                        </button>
                    </li>
                    <li>
                        <button type="button" class="dropdown-item" @click="updateField('style', 'dark')">
                            {{ $t("dark") }}
                        </button>
                    </li>
                </ul>
            </div>

            <div class="dropdown d-inline-block me-2">
                <button
                    :id="statusDropdownId"
                    class="btn btn-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    data-testid="incident-status-dropdown"
                    aria-expanded="false"
                >
                    Status: {{ statusLabel }}
                </button>
                <ul class="dropdown-menu" :aria-labelledby="statusDropdownId">
                    <li>
                        <button
                            type="button"
                            class="dropdown-item"
                            @click="updateField('status', 'investigating')"
                        >
                            Investigating
                        </button>
                    </li>
                    <li>
                        <button type="button" class="dropdown-item" @click="updateField('status', 'identified')">
                            Identified
                        </button>
                    </li>
                    <li>
                        <button type="button" class="dropdown-item" @click="updateField('status', 'monitoring')">
                            Monitoring
                        </button>
                    </li>
                    <li>
                        <button type="button" class="dropdown-item" @click="updateField('status', 'resolved')">
                            Resolved
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "IncidentEditForm",
    props: {
        modelValue: {
            type: Object,
            required: true,
        },
    },
    emits: ["update:modelValue", "post", "cancel"],
    computed: {
        statusLabel() {
            const s = this.modelValue.status;
            if (!s) {
                return "None";
            }
            return s.charAt(0).toUpperCase() + s.slice(1);
        },
        styleDropdownId() {
            return "incident-style-dropdown-" + (this.modelValue.id || "new");
        },
        statusDropdownId() {
            return "incident-status-dropdown-" + (this.modelValue.id || "new");
        },
    },
    methods: {
        updateField(field, value) {
            this.$emit("update:modelValue", {
                ...this.modelValue,
                [field]: value,
            });
        },
    },
};
</script>

<style lang="scss" scoped>
.incident {
    .content {
        &[contenteditable="true"] {
            min-height: 60px;
        }
    }
}
</style>
