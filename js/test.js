const BFC = (parameters) => {
    const self = {};

    for (let key in parameters) {
        self[key] = parameters[key];
    }

    self.parent_select = '#' + self.parent_id;
    // Initial
    let curr_pag = 94;
    // Page
    self.page_height = 400;
    self.page_width = 300;
    self.page_padd = 10;
    self.page_x = (self.width - self.page_width) / 2;
    self.page_y = 35;
    // Line
    self.lines_n = 34;
    self.lines_padd = 3;
    self.lines_height = (self.page_height - 2 * self.page_padd) / (self.lines_n) - self.lines_padd;
    // 
    self.num_pages = 176;

    self.data = {};

    self.flag = self.width < 500;

    self.box = d3.select('#box');

    self.line = d3.line()
        .x((d) => d.x)
        .y((d) => d.y);

    self.init = () => {
        d3.select(self.parent_select).append('div')
            .attr('id', 'box');

        self.svg = d3.select(self.parent_select)
            .append('svg')
            .attr('width', self.width)
            .attr('height', self.height)

        self.g_nav = self.svg.append('g')
            .attr("transform", "translate(" + 10 + ", " + (self.height - 50) + ")")
            .attr('width', self.width - 20)
            .attr('height', 30);

        self.g_page = self.svg.append('g')
            .attr("transform", "translate(" + (self.width / 2 - self.page_width / 2) + ", " + 0 + ")");

        self.g_lines = self.svg.append('g');

        self.svg.append('defs')
            .append('marker').attr('id', 'arrow')
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 0)
            .attr('refY', 0)
            .attr('markerWidth', 5)
            .attr('markerHeight', 5)
            .attr('viewBox', '-6 -6 12 12')
            .attr('orient', 'auto')
            .append('path')
            .attr("d", 'M 0, 0  m -5, 0  a 5,5 0 1,0 10,0  a 5,5 0 1,0 -10,0');

    }

    self.render = (book, normativa, citas) => {
        /* Page Title */
        self.page_title = self.g_page.append('text')
            .attr('x', self.page_width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .text('Página 1');

        // page
        self.g_page.append('rect')
            .attr('x', 0)
            .attr('y', self.page_y)
            .attr('width', self.page_width)
            .attr('height', self.page_height)
            .attr('fill', '#fff');

        self.lines = self.g_page.append('g').attr('class', 'lines');
        self.hl = self.g_page.append('g').attr('class', 'g_hl');

        // Navigation bar
        self.renderNavbar();
    }

    self.renderNavbar = () => {
        const nav_width = self.width - 20;
        const nav_height = 32;
        const item_width = nav_width / self.num_pages;

        // Bar
        self.g_nav.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', nav_width)
            .attr('height', nav_height)
            .attr('fill', '#fff')
            .style('cursor', 'pointer')
            .on('click', function () {
                const coords = d3.mouse(this);
                const x = coords[0];
                const page = Math.ceil(x / item_width);
                self.marker.attr('x', (page - 1) * item_width);
                self.updatePage(page);
            });

        // Marker
        self.marker = self.g_nav.append('rect')
            .attr('x', (curr_pag - 1) * item_width)
            .attr('y', -5)
            .attr('width', item_width)
            .attr('height', nav_height + 10)
            .attr('fill', 'transparent')
            .attr('stroke', 'rgba(0,0,0,0.75)')
            .attr('stroke-width', 3)
            .style('cursor', 'pointer')
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        function dragstarted(d) {
            d3.select(this).raise().classed("active", true);
        }

        function dragged(d) {
            d3.select(this)
                .attr("x", () => {
                    let x = d3.event.x;

                    x -= item_width;

                    // Fit to boundary
                    x = x < 0 ? 0 : x;
                    x = x > nav_width - item_width ? nav_width - item_width : x;

                    const page = Math.ceil(x / item_width) + 1;
                    self.updatePage(page);
                    return (page - 1) * item_width;
                });
        }

        function dragended(d) {
            d3.select(this).classed("active", false);
        }

        self.updatePage(curr_pag);
    }

    // START DATA

    self.prepareBook = (book) => {
        const book_map = {};

        book.forEach(d => {
            book_map[d['Página']] = {
                'page': d['Página'],
                'contenido': parseInt(d['Contenido']),
                'pie': parseInt(d['Pie']),
                'tipo': d['Tipo'],
            };
        });

        self.book = book_map;
    };

    self.addNormativa = function (data) {
        data.forEach(d => {
            if (d['Problema']) {
                const p = d['Página'];
                if (self.data[p] == undefined) {
                    self.data[p] = {
                        'citas': [],
                        'normativa': [],
                        'pie': [],
                        'tablas': [],
                        'graficos': [],
                        'bibliografia': [],
                    };
                }
                self.data[p]['normativa'].push(d);
            }
        });
    };

    self.addCitas = function (data) {
        data.forEach(d => {
            if (d['Problema']) {
                const p = d['Página'];
                if (self.data[p] == undefined) {
                    self.data[p] = {
                        'citas': [],
                        'normativa': [],
                        'pie': [],
                        'tablas': [],
                        'graficos': [],
                        'bibliografia': [],
                    };
                }
                self.data[p]['citas'].push(d);
            }
        });
    };

    self.addPie = function (data) {
        data.forEach(d => {
            if (d['Problema']) {
                const p = d['Página'];
                var s = parseInt(p.split('-')[0]);
                var e = p.split('-').length == 1 ? s : parseInt(p.split('-')[1]);
                for (var j = s; j <= e; j++) {
                    if (self.data[j] == undefined) {
                        self.data[j] = {
                            'citas': [],
                            'normativa': [],
                            'pie': [],
                            'tablas': [],
                            'graficos': [],
                            'bibliografia': [],
                        };
                    }

                    var lines = d['Línea'].toString();
                    var bloque = d['Bloque'].split('-');
                    var ls = parseInt(lines.split('-')[0]);
                    var le = lines.split('-').length == 1 ? ls : parseInt(lines.split('-')[1]);
                    for (let k = ls; k <= le; k++) {
                        var f = Object.assign({}, d);;
                        f['Línea'] = k;
                        f['Bloque1'] = 'a';
                        f['Bloque2'] = 'd';
                        if (k == ls) {
                            f['info'] = true;
                            f['Bloque1'] = bloque[0];
                        }
                        if (k == le && bloque.length > 1) {
                            f['Bloque2'] = bloque[1];
                        }
                        self.data[j]['pie'].push(f);
                    }
                };
            }
        });
    };

    self.addTablas = function (data) {
        data.forEach(d => {
            if (d['Problema']) {
                const p = d['Página'];
                var s = parseInt(p.split('-')[0]);
                var e = p.split('-').length == 1 ? s : parseInt(p.split('-')[1]);
                for (var j = s; j <= e; j++) {
                    if (self.data[j] == undefined) {
                        self.data[j] = {
                            'citas': [],
                            'normativa': [],
                            'pie': [],
                            'tablas': [],
                            'graficos': [],
                            'bibliografia': [],
                        };
                    }
                    self.data[j]['tablas'].push(d);
                };
            }
        });
    };

    self.addGraficos = function (data) {
        data.forEach(d => {
            if (d['Problema']) {
                const p = d['Página'];
                var s = parseInt(p.split('-')[0]);
                var e = p.split('-').length == 1 ? s : parseInt(p.split('-')[1]);
                for (var j = s; j <= e; j++) {
                    if (self.data[j] == undefined) {
                        self.data[j] = {
                            'citas': [],
                            'normativa': [],
                            'pie': [],
                            'tablas': [],
                            'graficos': [],
                            'bibliografia': [],
                        };
                    }
                    self.data[j]['graficos'].push(d);
                };
            }
        });
    };

    self.addBibliografia = function (data) {
        var nn = 0;
        data.forEach(d => {
            if (d['Problema']) {
                const p = d['Página'];
                if (self.data[p] == undefined) {
                    self.data[p] = {
                        'citas': [],
                        'normativa': [],
                        'pie': [],
                        'tablas': [],
                        'graficos': [],
                        'bibliografia': [],
                    };
                    nn = d['Número'];
                }
                d['Línea'] = d['Número'] - nn + 1;
                self.data[p]['bibliografia'].push(d);
            }
        });
    };

    // END DATA

    self.renderPage = (p) => {
        self.lines.selectAll('*').remove();

        const page = self.book[p];

        if (page == undefined) return;

        if (page.tipo == "Contenido") {
            // Page lines
            self.lines.selectAll('.line')
                .data(Array(page.contenido))
                .enter()
                .append('rect')
                .attr('class', (d, i) => 'line line-' + i)
                .attr('x', (d, i) => {
                    const x = i % 10 == 0 ? 20 : 0;
                    return x + self.page_padd;
                })
                .attr('y', (d, i) => {
                    const page_offset = self.page_y + self.page_padd;
                    const bar_height = self.lines_height + self.lines_padd;

                    return page_offset + i * (bar_height);
                })
                .attr('width', (d, i) => {
                    const x = i % 10 == 0 ? 20 : 0;
                    return self.page_width - 2 * self.page_padd - x;
                })
                .attr('height', self.lines_height)
                .style('fill', '#eeeeee');

            const pie_offset = self.page_height - self.page_padd - page.pie * (self.lines_height - 2 + self.lines_padd);

            // Pie lines
            self.lines.selectAll('.pie')
                .data(Array(page.pie))
                .enter()
                .append('rect')
                .attr('class', (d, i) => 'pie pie-' + i)
                .attr('x', self.page_padd + 15)
                .attr('y', (d, i) => {
                    const bar_height = (self.lines_height - 2) + self.lines_padd;
                    return self.page_y + pie_offset + i * (bar_height);
                })
                .attr('width', self.page_width - 2 * self.page_padd - 15)
                .attr('height', self.lines_height - 2)
                .style('fill', '#bbbbbb');
        }

        if (page.tipo == 'Referencia') {
            const padd = self.lines_padd * 2;
            let bar_height = (self.page_height - 2 * self.page_padd + padd) / (page.contenido) - padd;
            bar_height = Math.min(bar_height, 35);

            const content = self.lines.selectAll('.line')
                .data(Array(page.contenido))
                .enter()
                .append('rect')
                .attr('class', (d, i) => 'line line-' + i)
                .attr('x', self.page_padd)
                .attr('y', (d, i) => {
                    const page_offset = self.page_y + self.page_padd;

                    pie_offset = page_offset + i * (bar_height) + self.lines_height;

                    return page_offset + i * (bar_height + padd);
                })
                .attr('width', (d, i) => {
                    return self.page_width - 2 * self.page_padd;
                })
                .attr('height', bar_height)
                .style('fill', '#eee');
        }
        if (page.tipo == 'Tabla' || page.tipo == 'Gráfico') {
            const padd = self.lines_padd * 4;
            const bar_height = (self.page_height - 2 * self.page_padd + padd) / (page.contenido) - padd;

            self.lines.selectAll('.line')
                .data(Array(page.contenido))
                .enter()
                .append('rect')
                .attr('class', (d, i) => 'line line-' + i)
                .attr('x', self.page_padd)
                .attr('y', (d, i) => {
                    const page_offset = self.page_y + self.page_padd;

                    pie_offset = page_offset + i * (bar_height) + self.lines_height;

                    return page_offset + i * (bar_height + padd);
                })
                .attr('width', (d, i) => {
                    return self.page_width - 2 * self.page_padd;
                })
                .attr('height', bar_height)
                .style('fill', '#eee');
        }

        self.paint(p);
    };

    self.paint = (p) => {
        var page__book = self.book[p];
        var page = self.data[p];
        self.hl.selectAll('*').remove();

        d3.select('#box').selectAll('.item').remove();
        d3.selectAll('.hl_text').remove();
        self.k = 0;
        self.y1 = 10;
        self.y2 = 10;

        if (!page) return;

        // Normativa
        self.hl
            .selectAll('.normativa')
            .data(page.normativa)
            .enter()
            .append('rect')
            .attr('class', 'hl normativa')
            .attr('x', d => {
                let padd_x = 0;
                const f = (self.page_width - 2 * self.page_padd) / 4;
                switch (d['Bloque']) {
                    case 'a':
                        padd_x = 0;
                        break;
                    case 'b':
                        padd_x = f;
                        break;
                    case 'c':
                        padd_x = 2 * f;
                        break;
                    case 'd':
                        padd_x = 3 * f;
                        break;
                }
                return self.page_padd + padd_x;
            })
            .attr('y', d => {
                var line = parseInt(d['Línea'].replace('(pie)')) - 1;
                const page_offset = self.page_y + self.page_padd;
                const bar_height = self.lines_height + self.lines_padd;
                return page_offset + line * (bar_height);
            })
            .attr('width', '55')
            .attr('height', self.lines_height)
            .style('fill', 'red')
            .on('mousemove', d => showTooltip(d))
            .on('mouseout', d => hideTooltip())
            .each(function (d) { renderInfo(this, d); });

        // Citas
        self.hl
            .selectAll('.cita')
            .data(page.citas)
            .enter()
            .append('rect')
            .attr('class', 'hl cita')
            .attr('x', d => {
                let padd_x = 0;
                const f = (self.page_width - 2 * self.page_padd) / 4;
                switch (d['Bloque']) {
                    case 'a':
                        padd_x = 0;
                        break;
                    case 'b':
                        padd_x = f;
                        break;
                    case 'c':
                        padd_x = 2 * f;
                        break;
                    case 'd':
                        padd_x = 3 * f;
                        break;
                }
                return self.page_padd + padd_x;
            })
            .attr('y', d => {
                var line = parseInt(d['Línea'].replace('(pie)')) - 1;
                const page_offset = self.page_y + self.page_padd;
                const bar_height = self.lines_height + self.lines_padd;
                return page_offset + line * (bar_height);
            })
            .attr('width', '55')
            .attr('height', self.lines_height)
            .style('fill', 'green')
            .on('mousemove', d => showTooltip(d))
            .on('mouseout', d => hideTooltip())
            .each(function (d) { renderInfo(this, d); });

        // Tablas
        let padd = self.lines_padd * 4;
        let bar_height = (self.page_height - 2 * self.page_padd - padd) / 2;
        self.hl
            .selectAll('.tabla')
            .data(page.tablas)
            .enter()
            .append('rect')
            .attr('class', 'hl tabla')
            .attr('x', self.page_padd)
            .attr('y', d => {
                var line = parseInt(d['Bloque'].split('0')[0]) - 1;
                const page_offset = self.page_y + self.page_padd;
                return page_offset + line * (bar_height + padd);
            })
            .attr('width', (d, i) => {
                return self.page_width - 2 * self.page_padd;
            })
            .attr('height', d => {
                var s = parseInt(d['Bloque'].split('-')[0]);
                var e = d['Bloque'].split('-').length == 1 ? s : parseInt(d['Bloque'].split('-')[1]);
                return s - e == 0 ? bar_height : (2 * bar_height + padd);
            })
            .style('fill', 'yellow')
            .on('mousemove', d => showTooltip(d))
            .on('mouseout', d => hideTooltip())
            .each(function (d) { renderInfo(this, d); });

        // Graficos
        self.hl
            .selectAll('.grafico')
            .data(page.graficos)
            .enter()
            .append('rect')
            .attr('class', 'hl grafico')
            .attr('x', self.page_padd)
            .attr('y', d => {
                var line = parseInt(d['Bloque'].split('0')[0]) - 1;
                const page_offset = self.page_y + self.page_padd;
                return page_offset + line * (bar_height + padd);
            })
            .attr('width', (d, i) => {
                return self.page_width - 2 * self.page_padd;
            })
            .attr('height', d => {
                var s = parseInt(d['Bloque'].split('-')[0]);
                var e = d['Bloque'].split('-').length == 1 ? s : parseInt(d['Bloque'].split('-')[1]);
                return s - e == 0 ? bar_height : (2 * bar_height + padd);
            })
            .style('fill', 'orange')
            .on('mousemove', d => showTooltip(d))
            .on('mouseout', d => hideTooltip())
            .each(function (d) { renderInfo(this, d); });



        const pie_offset = self.page_height - self.page_padd - page__book.pie * (self.lines_height - 2 + self.lines_padd);

        // Pie
        self.hl
            .selectAll('.pie')
            .data(page.pie)
            .enter()
            .append('rect')
            .attr('class', 'hl pie')
            .attr('x', d => {
                let padd_x = 0;
                const f = (self.page_width - 2 * self.page_padd - 15) / 4;
                switch (d['Bloque1']) {
                    case 'a':
                        padd_x = 0;
                        break;
                    case 'b':
                        padd_x = f;
                        break;
                    case 'c':
                        padd_x = 2 * f;
                        break;
                    case 'd':
                        padd_x = 3 * f;
                        break;
                }
                return self.page_padd + 15 + padd_x;
            })
            .attr('y', (d, i) => {
                var line = parseInt(d['Línea']) - 1;
                const bar_height = (self.lines_height - 2) + self.lines_padd;
                return self.page_y + pie_offset + line * (bar_height);
            })
            .attr('width', d => {
                let width_x = 0;
                const f = (self.page_width - 2 * self.page_padd - 15) / 4;
                switch (d['Bloque2']) {
                    case 'a':
                        width_x = f;
                        break;
                    case 'b':
                        width_x = 2 * f;
                        break;
                    case 'c':
                        width_x = 3 * f;
                        break;
                    case 'd':
                        width_x = 4 * f;
                        break;
                }
                return width_x;
            })
            .attr('height', self.lines_height - 2)
            .style('fill', 'blue')
            .on('mousemove', d => showTooltip(d))
            .on('mouseout', d => hideTooltip())
            .filter(d => d.info)
            .each(function (d) { renderInfo(this, d); });

        // Bibliografía
        padd = self.lines_padd * 2;
        bar_height = (self.page_height - 2 * self.page_padd + padd) / (page__book.contenido) - padd;
        bar_height = Math.min(bar_height, 35);

        self.hl
            .selectAll('.bibliografia')
            .data(page.bibliografia)
            .enter()
            .append('rect')
            .attr('class', 'hl bibliografia')
            .attr('x', self.page_padd)
            .attr('y', d => {
                var line = parseInt(d['Línea']) - 1;
                const page_offset = self.page_y + self.page_padd;
                return page_offset + line * (bar_height + padd);
            })
            .attr('width', (d, i) => {
                return self.page_width - 2 * self.page_padd;
            })
            .attr('height', bar_height)
            .style('fill', 'aquamarine')
            .on('mousemove', d => showTooltip(d))
            .on('mouseout', d => hideTooltip())
            .each(function (d) { renderInfo(this, d); });

        function showTooltip(d) {
            if (!self.flag) return;
            const tooltip = d3.select("#tooltip");
            const coordinates = d3.mouse(d3.select('#root').node());
            const x = self.width / 2;
            const y = coordinates[1];

            tooltip
                .style('left', x + 'px')
                .style('top', y + 'px')
                .style('display', 'block')
                .select('.content')
                .html(
                    '<b>Fragmento</b>:<br> ' + d['Fragmento'] + '<br><br>' +
                    '<b>Problema</b>:<br> ' + d['Problema']
                );

            tooltip
                .select('.triangle')
                .style('left', coordinates[0] + 'px');
        }

        function hideTooltip() {
            d3.select("#tooltip")
                .style('display', 'none')
        }

        function renderInfo(that, d) {
            if (self.flag) return;
            const el = d3.select(that).node().getBBox();
            const px = self.k % 2 == 0 ? 10 : self.width - 340;
            const py = self.k % 2 == 0 ? self.y1 : self.y2;

            var item = d3.select('#box')
                .append('div')
                .attr('class', 'item')
                .style('left', px + 'px')
                .style('top', py + 'px')
                .html(
                    '<b>Fragmento:</b><br>' + d.Fragmento + '<br><br>' +
                    '<b>Problema:</b><br>' + d.Problema + '<br>'
                );

            if (self.k % 2 == 0) {
                var points = [{
                    x: px + 330,
                    y: py
                },
                {
                    x: px + 340,
                    y: py
                },
                {
                    x: self.width / 2 - self.page_width / 2 + el.x,
                    y: el.y
                }
                ];
            } else {
                var points = [{
                    x: px,
                    y: py
                },
                {
                    x: px - 10,
                    y: py
                },
                {
                    x: self.width / 2 - self.page_width / 2 + el.x + el.width,
                    y: el.y
                }
                ];
            }

            self.g_lines
                .append('path')
                .attr('class', 'hl_text')
                .attr('d', (d) => self.line(points))
                .attr('fill', 'transparent')
                .attr('stroke', 'black')
                .attr('stroke-width', 1.5)
                .attr('marker-end', 'url(#arrow)');

            var h = item.node().getBoundingClientRect().height;

            if (self.k % 2 == 0) {
                self.y1 += (h + 10);
            } else {
                self.y2 += (h + 10);
            }

            self.k += 1;
        }
    };

    self.updatePage = (p) => {
        self.renderPage(p);
        self.page_title.text('Página ' + p);
    }

    self.init();
    return self;
}

(async () => {
    const bfc = BFC({
        parent_id: 'root',
        width: d3.select('#root').node().getBoundingClientRect().width,
        height: 500,
    });

    const normativa = await d3.csv("normativa.csv");
    const citas = await d3.csv("citas.csv");
    const book = await d3.csv("libro.csv");
    const tablas = await d3.csv("tablas.csv");
    const graficos = await d3.csv("graficos.csv");
    const bibliografia = await d3.csv("bibliografia.csv");
    const pie = await d3.csv("pie.csv");
    bfc.prepareBook(book);
    bfc.addNormativa(normativa);
    bfc.addCitas(citas);
    bfc.addTablas(tablas);
    bfc.addGraficos(graficos);
    bfc.addBibliografia(bibliografia);
    bfc.addPie(pie);

    console.log(bfc.data)
    bfc.render();
})();