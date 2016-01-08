/************************************************************************
 * This file is part of EspoCRM.
 *
 * EspoCRM - Open Source CRM application.
 * Copyright (C) 2014-2015 Yuri Kuznetsov, Taras Machyshyn, Oleksiy Avramenko
 * Website: http://www.espocrm.com
 *
 * EspoCRM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * EspoCRM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoCRM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word.
 ************************************************************************/

Espo.define('views/dashlets/options/base', ['views/modal', 'views/record/detail', 'model', 'view-record-helper'], function (Dep, Detail, Model, ViewRecordHelper) {

    var self;

    return Dep.extend({

        name: null,

        template: 'dashlets/options/base',

        cssName: 'options-modal',

        fieldsMode: 'edit',

        data: function () {
            return {
                options: this.optionsData,
            };
        },

        buttonList: [
            {
                name: 'save',
                label: 'Save',
                style: 'primary'
            },
            {
                name: 'cancel',
                label: 'Cancel'
            }
        ],

        getDetailLayout: function () {
            var layout = [{rows: []}];
            var i = 0;
            var a = [];
            for (var field in this.fields) {

                if (!(i % 2)) {
                    a = [];
                    layout[0].rows.push(a);
                }
                a.push({name: field});
                i++;
            }
            return layout;
        },

        init: function () {
            Dep.prototype.init.call(this);
            this.fields = this.options.fields;
            this.fieldList = Object.keys(this.fields);
            this.optionsData = this.options.optionsData;
        },

        setup: function (dialog) {
            this.id = 'dashlet-options';

            this.recordHelper = new ViewRecordHelper();

            var self = this;
            var model = this.model = new Model();
            model.name = 'DashletOptions';
            model.defs = {
                fields: this.fields
            };
            model.set(this.optionsData);

            this.createView('middle', 'views/record/detail-middle', {
                model: model,
                recordHelper: this.recordHelper,
                _layout: {
                    type: 'record',
                    layout: Detail.prototype.convertDetailLayout.call(this, this.getDetailLayout())
                },
                el: this.options.el + ' .middle',
                layoutData: {
                    model: model,
                    columnCount: 2,
                },
            });

            this.header = this.getLanguage().translate('Dashlet Options') + ': ' + this.getLanguage().translate(this.name, 'dashlets');
        },

        fetchAttributes: function () {
            var attributes = {};
            this.fieldList.forEach(function (field) {
                var fieldView = this.getView('middle').getView(field);
                _.extend(attributes, fieldView.fetch());
            }, this);

            this.model.set(attributes, {silent: true});

            var valid = true;
            this.fieldList.forEach(function (field) {
                var fieldView = this.getView('middle').getView(field);
                valid = !fieldView.validate() && valid;
            }, this);

            if (!valid) {
                this.notify('Not Valid', 'error');
                return null;
            }
            return attributes;
        },

        actionSave: function (dialog) {
            var attributes = this.fetchAttributes();
            if (attributes == null) {
                return;
            }

            var id = this.getParentView().id;

            this.notify('Saving...');

            this.getPreferences().once('sync', function () {
                this.getPreferences().trigger('update');

                this.notify(false);
                var dashlet = this.getParentView();

                this.close();

                dashlet.setup();
                dashlet.render();

            }, this);

            var o = this.getPreferences().get('dashletOptions') || {};
            o[id] = attributes;

            this.getPreferences().save({
                dashletOptions: o
            }, {patch: true});

        },
    });
});


