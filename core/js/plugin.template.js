/* This file is part of Jeedom.
 *
 * Jeedom is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Jeedom is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Jeedom. If not, see <http://www.gnu.org/licenses/>.
 */

document.body.setAttribute('data-type', 'plugin')
document.querySelector('.nav-tabs a:not(.eqLogicAction)')?.click()

if (!jeeFrontEnd.pluginTemplate) {
  jeeFrontEnd.pluginTemplate = {
    init: function() {
      window.jeeP = this
      window.addCmdToTableDefault = this.addCmdToTableDefault
      this.setTableDisplay()
      if (is_numeric(getUrlVars('id'))) {
        jeeFrontEnd.pluginTemplate.displayEqlogic(null, getUrlVars('id'))
      }
    },
    setTableDisplay: function() {
      var butDisp = document.getElementById('bt_pluginDisplayAsTable')
      if (!butDisp) return
      var coreSupport = butDisp.dataset.coresupport == '1' ? true : false
      if (butDisp != null) {
        butDisp.removeClass('hidden') //Not shown on previous core versions
        if (getCookie('jeedom_displayAsTable') == 'true' || jeedom.theme.theme_displayAsTable == 1) {
          butDisp.addClass('active').dataset.sate = '1'
          if (coreSupport) {
            document.querySelectorAll('.eqLogicDisplayCard')?.addClass('displayAsTable')
            document.querySelectorAll('.eqLogicDisplayCard .hiddenAsCard')?.removeClass('hidden')
            document.querySelector('.eqLogicThumbnailContainer').addClass('containerAsTable')
          }
        }
        //core event:
        if (coreSupport) {
          butDisp.unRegisterEvent('click').registerEvent('click', function(event) {
            if (butDisp.dataset.sate == '0') {
              butDisp.addClass('active').dataset.sate = '1'
              setCookie('jeedom_displayAsTable', 'true', 2)
              document.querySelectorAll('.eqLogicDisplayCard')?.addClass('displayAsTable')
              document.querySelectorAll('.eqLogicDisplayCard .hiddenAsCard')?.removeClass('hidden')
              document.querySelector('.eqLogicThumbnailContainer').addClass('containerAsTable')
            } else {
              butDisp.removeClass('active').dataset.sate = '0'
              setCookie('jeedom_displayAsTable', 'false', 2)
              document.querySelectorAll('.eqLogicDisplayCard')?.removeClass('displayAsTable')
              document.querySelectorAll('.eqLogicDisplayCard .hiddenAsCard')?.addClass('hidden')
              document.querySelector('.eqLogicThumbnailContainer').removeClass('containerAsTable')
            }
          })
        }
      }
    },
    displayEqlogic: function(_type, _eqlogicId) {
      jeedom.eqLogic.cache.getCmd = Array()
      document.querySelectorAll('.eqLogicThumbnailDisplay, .eqLogic').unseen()
      if (typeof prePrintEqLogic === 'function') {
        prePrintEqLogic(_eqlogicId)
      }
      if (_type != null && document.querySelector('.' + _type) != null) {
        document.querySelectorAll('.' + _type).seen()
      } else {
        document.querySelectorAll('.eqLogic').seen()
      }
      document.querySelectorAll('.eqLogicDisplayCard.active').removeClass('active')
      document.querySelector('.eqLogicDisplayCard[data-eqlogic_id="' + _eqlogicId + '"]').addClass('active')
      document.querySelector('.nav-tabs a:not(.eqLogicAction)')?.click()
      domUtils.showLoading()
      jeedom.eqLogic.print({
        type: _type != null ? _type : eqType,
        id: _eqlogicId,
        status: 1,
        getCmdState : 1,
        error: function(error) {
          domUtils.hideLoading()
          jeedomUtils.showAlert({
            message: error.message,
            level: 'danger'
          })
        },
        success: function(data) {
          document.getElementById('div_pageContainer').querySelectorAll('.eqLogicAttr').jeeValue('')
          if (isset(data) && isset(data.timeout) && data.timeout == 0) {
            data.timeout = ''
          }
          document.getElementById('div_mainContainer').setJeeValues(data, '.eqLogicAttr')
          if (!isset(data.category.opening)) try { document.querySelector('input[data-l2key="opening"]').checked = false } catch (e) { }

          if (typeof printEqLogic === 'function') {
            setTimeout(() => { printEqLogic(data) })
          }
          document.querySelectorAll('.cmd').remove()
          for (var i in data.cmd) {
            if (data.cmd[i].type == 'info') {
              data.cmd[i].state = String(data.cmd[i].state).replace(/<[^>]*>?/gm, '')
              data.cmd[i]['htmlstate'] =  '<span class="cmdTableState"'
              data.cmd[i]['htmlstate'] += 'data-cmd_id="' + data.cmd[i].id+ '"'
              data.cmd[i]['htmlstate'] += 'title="{{Date de valeur}} : ' + data.cmd[i].valueDate + '<br/>{{Date de collecte}} : ' + data.cmd[i].collectDate
              if (data.cmd[i].state.length > 50) {
                data.cmd[i]['htmlstate'] += '<br/>' + data.cmd[i].state.replaceAll('"','&quot;')
              }
              data.cmd[i]['htmlstate'] += '" >'
              data.cmd[i]['htmlstate'] += data.cmd[i].state.substring(0, 50) +  ' ' + data.cmd[i].unite
              data.cmd[i]['htmlstate'] += '<span>'
            } else {
              data.cmd[i]['htmlstate'] = '';
            }
            if (typeof addCmdToTable === 'function') {
              addCmdToTable(data.cmd[i])
            } else {
              jeeFrontEnd.pluginTemplate.addCmdToTableDefault(data.cmd[i])
            }
            jeedomUtils.initTooltips()
          }
          document.querySelectorAll('.cmdTableState').forEach(_cmdState => {
            jeedom.cmd.addUpdateFunction(_cmdState.getAttribute('data-cmd_id'), function(_options) {
              _options.display_value = String(_options.display_value).replace(/<[^>]*>?/gm, '')
              let cmd = document.querySelector('.cmdTableState[data-cmd_id="' + _options.cmd_id + '"]')
              if (cmd === null) {
                return
              }
              let title = '{{Date de collecte}} : ' + _options.collectDate + '<br/>{{Date de valeur}} ' + _options.valueDate
              if (_options.display_value.length > 50) {
                title += ' - ' + _options.display_value
              }
              cmd.setAttribute('title', title)
              cmd.empty().innerHTML = _options.display_value.substring(0, 50) + ' ' + _options.unit
              cmd.style.color = 'var(--logo-primary-color)'
              setTimeout(function() {
                cmd.style.color = null
                jeedomUtils.initTooltips()
              }, 1000)
            })
          })

          jeedomUtils.addOrUpdateUrl('id', data.id)
          domUtils.hideLoading()
          jeeFrontEnd.modifyWithoutSave = false
          setTimeout(function() {
            jeeFrontEnd.modifyWithoutSave = false
          }, 1000)
        }
      })
    },
    addCmdToTableDefault: function(_cmd) {
      if (document.getElementById('table_cmd') == null) return
      if (document.querySelector('#table_cmd thead') == null) {
        table = '<thead>';
        table += '<tr>';
        table += '<th>{{Id}}</th>';
        table += '<th>{{Nom}}</th>';
        table += '<th>{{Type}}</th>';
        table += '<th>{{Logical ID}}</th>';
        table += '<th>{{Options}}</th>';
        table += '<th>{{Paramètres}}</th>';
        table += '<th>{{Etat}}</th>';
        table += '<th>{{Action}}</th>';
        table += '</tr>';
        table += '</thead>';
        table += '<tbody>';
        table += '</tbody>';
        document.getElementById('table_cmd').insertAdjacentHTML('beforeend', table)
      }
      if (!isset(_cmd)) {
        var _cmd = {configuration: {}};
      }
      if (!isset(_cmd.configuration)) {
        _cmd.configuration = {};
      }
      var tr = '<tr>';
        tr += '<td style="min-width:50px;width:70px;">';
        tr += '<span class="cmdAttr" data-l1key="id"></span>';
        tr += '</td>';
        tr += '<td>';
        tr += '<div class="row">';
        tr += '<div class="col-sm-6">';
        tr += '<a class="cmdAction btn btn-default btn-sm" data-l1key="chooseIcon"><i class="fa fa-flag"></i> Icône</a>';
        tr += '<span class="cmdAttr" data-l1key="display" data-l2key="icon" style="margin-left : 10px;"></span>';
        tr += '</div>';
        tr += '<div class="col-sm-6">';
        tr += '<input class="cmdAttr form-control input-sm" data-l1key="name">';
        tr += '</div>';
        tr += '</div>';
        tr += '<select class="cmdAttr form-control input-sm" data-l1key="value" style="display : none;margin-top : 5px;" title="{{La valeur de la commande vaut par défaut la commande}}">';
        tr += '<option value="">Aucune</option>';
        tr += '</select>';
        tr += '</td>';
        tr += '<td>';
        tr += '<span class="type" type="' + init(_cmd.type) + '">' + jeedom.cmd.availableType() + '</span>';
        tr += '<span class="subType" subType="' + init(_cmd.subType) + '"></span>';
        tr += '</td>';
        tr += '<td style="min-width:400px"><input class="cmdAttr form-control input-sm" data-l1key="logicalId" value="0" style="width : 70%; display : inline-block;" placeholder="{{Commande}}"><br/>';
        tr += '</td>';
        tr += '<td>';
        tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="returnStateValue" placeholder="{{Valeur retour d\'état}}" style="width:48%;display:inline-block;">';
        tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="returnStateTime" placeholder="{{Durée avant retour d\'état (min)}}" style="width:48%;display:inline-block;margin-left:2px;">';
        tr += '<select class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="updateCmdId" style="display : none;" title="{{Commande d\'information à mettre à jour}}">';
        tr += '<option value="">Aucune</option>';
        tr += '</select>';
        tr += '</td>';
        tr += '<td>';
        tr += '<input class="tooltips cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="minValue" placeholder="{{Min}}" title="{{Min}}" style="width:30%;display:inline-block;">';
        tr += '<input class="tooltips cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="maxValue" placeholder="{{Max}}" title="{{Max}}" style="width:30%;display:inline-block;">';
        tr += '<input class="cmdAttr form-control input-sm" data-l1key="unite" placeholder="{{Unité}}" title="{{Unité}}" style="width:30%;display:inline-block;margin-left:2px;">';
        tr += '<input class="tooltips cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="listValue" placeholder="{{Liste de valeur|texte séparé par ;}}" title="{{Liste}}">';
        tr += '<span><label class="checkbox-inline"><input type="checkbox" class="cmdAttr checkbox-inline" data-l1key="isVisible" checked/>{{Afficher}}</label></span> ';
        tr += '<span><label class="checkbox-inline"><input type="checkbox" class="cmdAttr checkbox-inline" data-l1key="isHistorized" checked/>{{Historiser}}</label></span> ';
        tr += '<span><label class="checkbox-inline"><input type="checkbox" class="cmdAttr" data-l1key="display" data-l2key="invertBinary"/>{{Inverser}}</label></span> ';
        tr += '</td>';
        tr += '<td>';
        tr += '<span class="cmdAttr" data-l1key="htmlstate"></span>';
        tr += '</td>';
        tr += '<td>';
      if (is_numeric(_cmd.id)) {
        tr += '<a class="btn btn-default btn-xs cmdAction" data-action="configure"><i class="fas fa-cogs"></i></a> '
        tr += '<a class="btn btn-default btn-xs cmdAction" data-action="test"><i class="fa fa-rss"></i> {{Tester}}</a>'
      }
      tr += '<i class="fas fa-minus-circle pull-right cmdAction cursor" data-action="remove"></i>'
      tr += '</td>'
      tr += '</tr>'

      let newRow = document.createElement('tr')
      newRow.innerHTML = tr
      newRow.addClass('cmd')
      newRow.setAttribute('data-cmd_id', init(_cmd.id))
      document.getElementById('table_cmd').querySelector('tbody').appendChild(newRow)

      jeedom.eqLogic.buildSelectCmd({
        id: document.querySelector('.eqLogicAttr[data-l1key="id"]').jeeValue(),
        filter: {type: 'info'},
        error: function (error) {
          $('#div_alert').showAlert({message: error.message, level: 'danger'})
        },
        success: function (result) {
          newRow.querySelector('.cmdAttr[data-l1key="value"]').insertAdjacentHTML('beforeend', result)
          newRow.setJeeValues(_cmd, '.cmdAttr')
          jeedom.cmd.changeType(newRow, init(_cmd.subType))
        }
      })
    },
  }
}

jeeFrontEnd.pluginTemplate.init()

$('#bt_resetSearch').on('click', function() {
  document.getElementById('in_searchEqlogic').jeeValue('').triggerEvent('keyup')
})

$('#div_pageContainer').on({
  'change': function(event) {
    jeeFrontEnd.modifyWithoutSave = true
  }
}, '.cmd .cmdAttr:visible, .eqLogic .eqLogicAttr:visible')

$('.eqLogicAction[data-action="gotoPluginConf"]').on('click', function() {
  jeeDialog.dialog({
    id: 'jee_modal',
    title: '{{Configuration du plugin}}',
    height: '85%',
    contentUrl: 'index.php?v=d&p=plugin&ajax=1&id=' + eqType
  })
})

$('.eqLogicAction[data-action="returnToThumbnailDisplay"]').removeAttr('data-target').off('click').on('click', function(event) {
  setTimeout(function() {
    let id = document.querySelector('.tab-pane.active')?.getAttribute('id')
    document.querySelectorAll('.nav li.active').removeClass('active')
    document.querySelector('a[data-target="#' + id + '"]')?.closest('li').addClass('active')
  }, 500)
  if (jeedomUtils.checkPageModified()) return
  jeedomUtils.hideAlert()
  document.querySelectorAll('.eqLogic').unseen()
  document.querySelectorAll('.eqLogicThumbnailDisplay').seen()
  this.closest('ul').querySelector('li').removeClass('active')
  jeedomUtils.addOrUpdateUrl('id', null)
})

$(".eqLogicDisplayCard").on('click', function(event) {
  jeedomUtils.hideAlert()
  let type = document.body.getAttribute('data-page')
  let thisEqId = event.target.closest('.eqLogicDisplayCard').getAttribute('data-eqlogic_id')
  if ((isset(event.detail) && event.detail.ctrlKey) || event.ctrlKey || event.metaKey) {
    var url = 'index.php?v=d&m=' + type + '&p=' + type + '&id=' + thisEqId
    window.open(url).focus()
  } else {
    let thisEqType = event.target.closest('.eqLogicDisplayCard').getAttribute('data-eqLogic_type')
    jeeFrontEnd.pluginTemplate.displayEqlogic(thisEqType, thisEqId)
  }
  return false
})

$('.eqLogicDisplayCard').off('mouseup').on('mouseup', function(event) {
  if (event.which == 2) {
    event.preventDefault()
    var id = this.getAttribute('data-eqlogic_id')
    document.querySelector('.eqLogicDisplayCard[data-eqlogic_id="' + id + '"]')?.triggerEvent('click', {detail: {ctrlKey: true}})
  }
})

$('#div_pageContainer').on({
  'change': function(event) {
    jeedom.cmd.changeType(this.closest('.cmd'))
  }
}, '.cmd .cmdAttr[data-l1key="type"]')

$('#div_pageContainer').on({
  'change': function(event) {
    jeedom.cmd.changeSubType(this.closest('.cmd'))
  }
}, '.cmd .cmdAttr[data-l1key="subType"]')
/**************************EqLogic*********************************************/
$('.eqLogicAction[data-action="copy"]').off('click').on('click', function() {
  var name = document.querySelector('.eqLogicAttr[data-l1key="name"]').jeeValue()
  var id = document.querySelector('.eqLogicAttr[data-l1key="id"]').jeeValue()
  if (id != undefined && id != '') {
    jeeDialog.prompt({
      value: name,
      title: '{{Nom de la copie de l\'équipement ?}}',
      callback: function(result) {
        if (result !== null) {
          jeedom.eqLogic.copy({
            id: id,
            name: result,
            error: function(error) {
              jeedomUtils.showAlert({
                message: error.message,
                level: 'danger'
              });
            },
            success: function(data) {
              jeeFrontEnd.modifyWithoutSave = false
              var vars = getUrlVars()
              var url = 'index.php?'
              for (var i in vars) {
                if (i != 'id' && i != 'saveSuccessFull' && i != 'removeSuccessFull') {
                  url += i + '=' + vars[i].replace('#', '') + '&'
                }
              }
              url += 'id=' + data.id + '&saveSuccessFull=1'
              jeedomUtils.loadPage(url)
            }
          })
          return false
        }
      }
    })
  }
})

$('.eqLogicAction[data-action="export"]').off('click').on('click', function() {
  window.open('core/php/export.php?type=eqLogic&id=' + document.querySelector('.eqLogicAttr[data-l1key="id"]').jeeValue(), "_blank", null)
})

$('.eqLogicAction[data-action="save"]').off('click').on('click', function(event) {
  jeeFrontEnd.modifyWithoutSave = false
  modifyWithoutSave = false
  var eqLogics = []
  document.querySelectorAll('.eqLogic').forEach(_eqLogic => {
    if (_eqLogic.isVisible()) {
      var eqLogic = _eqLogic.getJeeValues('.eqLogicAttr')[0]

      //No subType will break:
      _eqLogic.querySelectorAll('tr.cmd select[data-l1key="subType"]').forEach(_select => {
        if (_select.value == '') {
          _select.selectedIndex = 0
        }
      })

      eqLogic.cmd = _eqLogic.querySelectorAll('.cmd').getJeeValues('.cmdAttr')
      if (typeof saveEqLogic === 'function') {
        eqLogic = saveEqLogic(eqLogic)
      }
      eqLogics.push(eqLogic)
    }
  })
  let thisEqType = event.target.getAttribute('data-eqLogic_type')
  jeedom.eqLogic.save({
    type: thisEqType != null ? thisEqType : eqType,
    id: null,
    eqLogics: eqLogics,
    error: function(error) {
      jeedomUtils.showAlert({
        message: error.message,
        level: 'danger'
      })
    },
    success: function(data) {
      jeeFrontEnd.modifyWithoutSave = false
      var vars = getUrlVars()
      var url = 'index.php?'
      for (var i in vars) {
        if (i != 'id' && i != 'saveSuccessFull' && i != 'removeSuccessFull') {
          url += i + '=' + vars[i].replace('#', '') + '&'
        }
      }

      var id
      if (Array.isArray(data)) {
        id = data[0].id
      } else {
        id = data.id
      }
      url += 'id=' + id + '&saveSuccessFull=1'

      if (window.location.hash != '') {
        url += window.location.hash
      }

      jeedomUtils.loadPage(url)
      jeeFrontEnd.modifyWithoutSave = false
    }
  })
  return false
})

$('.eqLogicAction[data-action="remove"]').off('click').on('click', function() {
  var eqLogicValue = document.querySelector('.eqLogicAttr[data-l1key="id"]').jeeValue()
  let thisEqType = this.getAttribute('data-eqLogic_type')
  let textEqtype = thisEqType || eqType
  if (eqLogicValue != undefined) {
    jeedom.eqLogic.getUseBeforeRemove({
      id: eqLogicValue,
      error: function(error) {
        jeedomUtils.showAlert({
          message: error.message,
          level: 'danger'
        })
      },
      success: function(data) {
        var text = '{{Êtes-vous sûr de vouloir supprimer l\'équipement}} ' + textEqtype + ' <b>' + document.querySelector('.eqLogicAttr[data-l1key="name"]').jeeValue() + '</b> ?'
        if (Object.keys(data).length > 0) {
          text += ' </br> {{Il est utilisé par ou utilise :}}</br>'
          var complement = null
          for (var i in data) {
            complement = ''
            if ('sourceName' in data[i]) {
              complement = ' (' + data[i].sourceName + ')'
            }
            text += '- ' + '<a href="' + data[i].url + '" target="_blank">' + data[i].type + '</a> : <b>' + data[i].name + '</b>' + complement + ' <sup><a href="' + data[i].url + '" target="_blank"><i class="fas fa-external-link-alt"></i></a></sup></br>'
          }
        }
        text = text.substring(0, text.length - 2)
        jeeDialog.confirm(text, function(result) {
          if (result) {
            jeedom.eqLogic.remove({
              type: thisEqType || eqType,
              id: eqLogicValue,
              error: function(error) {
                jeedomUtils.showAlert({
                  message: error.message,
                  level: 'danger'
                })
              },
              success: function() {
                var vars = getUrlVars()
                var url = 'index.php?'
                for (var i in vars) {
                  if (i != 'id' && i != 'removeSuccessFull' && i != 'saveSuccessFull') {
                    url += i + '=' + vars[i].replace('#', '') + '&'
                  }
                }
                jeeFrontEnd.modifyWithoutSave = false
                url += 'removeSuccessFull=1'
                jeedomUtils.loadPage(url)
              }
            })
          }
        })
      }
    })
  } else {
    jeedomUtils.showAlert({
      message: '{{Veuillez d\'abord sélectionner un}} ' + textEqtype,
      level: 'danger'
    })
  }
})

$('.eqLogicAction[data-action="add"]').off('click').on('click', function() {
  jeeDialog.prompt("{{Nom de l'équipement ?}}", function(result) {
    if (result !== null) {
      jeedom.eqLogic.save({
        type: eqType,
        eqLogics: [{
          name: result
        }],
        error: function(error) {
          jeedomUtils.showAlert({
            message: error.message,
            level: 'danger'
          });
        },
        success: function(_data) {
          var vars = getUrlVars()
          var url = 'index.php?'
          for (var i in vars) {
            if (i != 'id' && i != 'saveSuccessFull' && i != 'removeSuccessFull') {
              url += i + '=' + vars[i].replace('#', '') + '&'
            }
          }
          jeeFrontEnd.modifyWithoutSave = false
          url += 'id=' + _data.id + '&saveSuccessFull=1'
          jeedomUtils.loadPage(url)
        }
      })
    }
  })
})

$('.eqLogic .eqLogicAction[data-action="configure"]').off('click').on('click', function() {
  var eqName = document.querySelector('input.eqLogicAttr[data-l1key="name"]')
  eqName = (eqName.length ? ' : ' + eqName.val() : '')
  jeeDialog.dialog({
    id: 'jee_modal',
    title: '',
    contentUrl: 'index.php?v=d&modal=eqLogic.configure&eqLogic_id=' + document.querySelector('.eqLogicAttr[data-l1key="id"]').jeeValue()
  })
})

$('#in_searchEqlogic').off('keyup').keyup(function() {
  var search = this.value
  if (search == '') {
    document.querySelectorAll('.eqLogicDisplayCard').seen()
    return
  }
  document.querySelectorAll('.eqLogicDisplayCard').unseen()
  search = jeedomUtils.normTextLower(search)
  var text
  document.querySelectorAll('.eqLogicDisplayCard .name').forEach(_name => {
    text = jeedomUtils.normTextLower(_name.textContent)
    if (text.includes(search)) {
      _name.closest('.eqLogicDisplayCard').seen()
    }
  })
})

/**************************CMD*********************************************/
$('.cmdAction[data-action="add"]').on('click', function() {
  if (typeof addCmdToTable === 'function') {
    addCmdToTable()
  } else {
    jeeFrontEnd.pluginTemplate.addCmdToTableDefault()
  }
  document.querySelectorAll('.cmdAttr[data-l1key="type"]').last().triggerEvent('change')
  jeeFrontEnd.modifyWithoutSave = true
})

$('#div_pageContainer').on('click', '.cmd .cmdAction[data-l1key="chooseIcon"]', function() {
  var cmd = this.closest('.cmd')
  var icon = cmd.querySelector('[data-l2key="icon"] > i')
  var params = {}
  if (icon) params.icon = icon.attributes.class.value
  jeedomUtils.chooseIcon(function(_icon) {
    cmd.querySelector('.cmdAttr[data-l1key="display"][data-l2key="icon"]').empty().innerHTML = _icon
    jeeFrontEnd.modifyWithoutSave = true
  }, params)
})

$('#div_pageContainer').on('dblclick', '.cmd .cmdAttr[data-l1key="display"][data-l2key="icon"]', function() {
  jeeFrontEnd.modifyWithoutSave = true
  this.innerHTML = ''
})

$('#div_pageContainer').on('click', '.cmd .cmdAction[data-action="remove"]', function() {
  jeeFrontEnd.modifyWithoutSave = true
  this.closest('tr').remove()
})

$('#div_pageContainer').on('click', '.cmd .cmdAction[data-action="copy"]', function() {
  jeeFrontEnd.modifyWithoutSave = true
  var cmd = this.closest('.cmd').getJeeValues('.cmdAttr')[0]
  cmd.id = ''
  if (typeof addCmdToTable === 'function') {
    addCmdToTable(cmd)
  } else {
    jeeFrontEnd.pluginTemplate.addCmdToTableDefault(cmd)
  }
})

$('#div_pageContainer').on('click', '.cmd .cmdAction[data-action="test"]', function(event) {
  jeedomUtils.hideAlert()
  if (document.querySelector('.eqLogicAttr[data-l1key="isEnable"]').checked == true) {
    jeedom.cmd.test({
      id: this.closest('.cmd').getAttribute('data-cmd_id')
    })
  } else {
    jeedomUtils.showAlert({
      message: '{{Veuillez activer l\'équipement avant de tester une de ses commandes}}',
      level: 'warning'
    })
  }
})

$('#div_pageContainer').on('dblclick', '.cmd input,textarea,select,span,a', function(event) {
  event.stopPropagation()
})

$('#div_pageContainer').on('dblclick', '.cmd', function() {
  jeeDialog.dialog({
    id: 'jee_modal2',
    title: '',
    contentUrl: 'index.php?v=d&modal=cmd.configure&cmd_id=' + this.closest('.cmd').getAttribute('data-cmd_id')
  })
})

$('#div_pageContainer').on('click', '.cmd .cmdAction[data-action="configure"]', function() {
  jeeDialog.dialog({
    id: 'jee_modal2',
    title: '',
    contentUrl: 'index.php?v=d&modal=cmd.configure&cmd_id=' + this.closest('.cmd').getAttribute('data-cmd_id')
  })
})



//contextMenu
domUtils(function() {
  try {
    if (typeof Core_noEqContextMenu !== 'undefined') return false
    if (document.querySelector('.nav.nav-tabs') == null) return false
    $.contextMenu('destroy', $('.nav.nav-tabs'))
    var pluginId = document.body.getAttribute('data-page') || getUrlVars('p')
    jeedom.eqLogic.byType({
      type: pluginId,
      error: function(error) {
        jeedomUtils.showAlert({
          message: error.message,
          level: 'danger'
        })
      },
      success: function(_eqs) {
        if (_eqs.length == 0) {
          return;
        }
        var eqsGroups = []
        var humanName, humanCut, group, name
        for (var i = 0; i < _eqs.length; i++) {
          humanName = _eqs[i].humanName
          humanCut = humanName.split(']')
          group = humanCut[0].substr(1)
          name = humanCut[1].substr(1)
          eqsGroups.push(group)
        }
        eqsGroups = Array.from(new Set(eqsGroups))
        eqsGroups.sort()
        var eqsList = [], group, eqGroup
        for (var i = 0; i < eqsGroups.length; i++) {
          group = eqsGroups[i]
          eqsList[group] = []
          for (var j = 0; j < _eqs.length; j++) {
            humanName = _eqs[j].humanName
            humanCut = humanName.split(']')
            eqGroup = humanCut[0].substr(1)
            name = humanCut[1].substr(1)
            if (eqGroup.toLowerCase() != group.toLowerCase()) continue
            eqsList[group].push([name, _eqs[j].id])
          }
        }
        //set context menu!
        var contextmenuitems = {}
        var uniqId = 0, groupEq, items
        for (var group in eqsList) {
          groupEq = eqsList[group]
          items = {}
          for (var index in groupEq) {
            items[uniqId] = {
              'name': groupEq[index][0],
              'id': groupEq[index][1]
            }
            uniqId++
          }
          contextmenuitems[group] = {
            'name': group,
            'items': items
          }
        }
        if (Object.entries(contextmenuitems).length > 0 && contextmenuitems.constructor === Object) {
          $('.nav.nav-tabs').contextMenu({
            selector: 'li',
            autoHide: true,
            zIndex: 9999,
            className: 'eq-context-menu',
            callback: function(key, options, event) {
              if (!jeedomUtils.checkPageModified()) {
                let tab = null
                let tabObj = null
                if (document.location.toString().match('#')) {
                  tab = '#' + document.location.toString().split('#')[1]
                  if (tab != '#') {
                    tabObj = document.querySelector('a[data-target="' + tab + '"]')
                  }
                }
                jeedomUtils.hideAlert()
                if (event.ctrlKey || event.originalEvent.which == 2) {
                  var type = document.body.getAttribute('data-page')
                  var url = 'index.php?v=d&m=' + type + '&p=' + type + '&id=' + options.commands[key].id
                  if (tabObj) url += tab
                  window.open(url).focus()
                } else {
                  document.querySelector('.eqLogicDisplayCard[data-eqLogic_id="' + options.commands[key].id + '"]')?.click()
                  if (tabObj) tabObj.click()
                }
              }
            },
            items: contextmenuitems
          })
        }
      }
    })
  } catch (err) {
    console.log(err)
  }
})

domUtils(function() {
  document.registerEvent('keydown', function(event) {
    if (jeedomUtils.getOpenedModal()) return

    if ((event.ctrlKey || event.metaKey) && event.which == 83) { //s
      event.preventDefault()
      let bt = document.querySelector('.eqLogicAction[data-action="save"]')
      if (bt != null && bt.isVisible()) {
        bt.click()
        return
      }
    }
  })

  if ($("#table_cmd").sortable("instance")) {
    $("#table_cmd").sortable({
      delay: 350,
      distance: 20,
      cursor: "move",
      axis: 'y',
      items: "tr.cmd",
      appendTo: $("#table_cmd tbody"),
      zIndex: 0,
      forceHelperSize: true,
      forcePlaceholderSize: true,
      placeholder: "sortable-placeholder",
      start: function(event, ui) {
        ui.placeholder[0].style.setProperty('height', event.target.querySelector('tbody tr').clientHeight + 20 + 'px', 'important')
      },
      stop: function(event, ui) {
        jeeFrontEnd.modifyWithoutSave = true
      }
    })
  }
})

/* Let's see if it break ?
$("img.lazy").lazyload({
  event: "sporty"
})

$("img.lazy").each(function() {
  var el = $(this)
  if (el.attr('data-original2') != undefined) {
    $("<img>", {
      src: el.attr('data-original'),
      error: function() {
        $("<img>", {
          src: el.attr('data-original2'),
          error: function() {
            if (el.attr('data-original3') != undefined) {
              $("<img>", {
                src: el.attr('data-original3'),
                error: function() {
                  el.lazyload({
                    event: "sporty"
                  });
                  el.trigger("sporty")
                },
                load: function() {
                  el.attr("data-original", el.attr('data-original3'))
                  el.lazyload({
                    event: "sporty"
                  });
                  el.trigger("sporty")
                }
              });
            } else {
              el.lazyload({
                event: "sporty"
              });
              el.trigger("sporty")
            }
          },
          load: function() {
            el.attr("data-original", el.attr('data-original2'))
            el.lazyload({
              event: "sporty"
            });
            el.trigger("sporty")
          }
        });
      },
      load: function() {
        el.lazyload({
          event: "sporty"
        });
        el.trigger("sporty")
      }
    });
  } else {
    el.lazyload({
      event: "sporty"
    });
    el.trigger("sporty")
  }
})
*/




//Register events on top of page container:

//Manage events outside parents delegations:

//Specials

/*Events delegations
*/
