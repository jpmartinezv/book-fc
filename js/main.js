

const BFC = (parameters) => {
    const self = {};

    for (let key in parameters) {
        self[key] = parameters[key];
    }

    self.parent_select = '#' + self.parent_id;
    self.lines_n = 25;
    self.lines_height = 9;
    self.lines_padd = 6;
    self.page_width = 300;
    self.page_padd = 10;
    self.page_x = (self.width - self.page_width) / 2;
    self.page_y = 35;
    self.page_height = self.lines_height * self.lines_n + self.lines_padd * (self.lines_n - 1) + 2 * self.page_padd;
    self.num_pages = 150;

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

    self.render = (data) => {
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

        const lines = self.g_page.append('g');

        // Page lines
        lines.selectAll('.line')
            .data(Array(self.lines_n))
            .enter()
            .append('rect')
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
            .style('fill', '#eee');

        // Navigation bar
        self.renderNavbar(data);
    }

    self.renderNavbar = (data) => {
        const pages = {};
        const dots = [];
        const nav_width = self.width - 20;
        const nav_height = 30;
        const item_width = nav_width / self.num_pages;

        data.forEach(element => {
            if (pages[element['Página']] === undefined) {
                pages[element['Página']] = [];
            }
            pages[element['Página']].push(element);
        });

        for (const key in pages) {
            if (pages.hasOwnProperty(key)) {
                const page = pages[key];
                page.forEach((item, i) => {
                    dots.push({
                        page: parseInt(key),
                        data: item,
                        y: i
                    });
                })
            }
        }

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
                const page = Math.ceil(x / item_width) + 1;
                self.updatePage(page - 1, pages[page - 1]);
                self.marker.attr('x', (page - 2) * item_width);
            });

        // Dots
        const g_dots = self.g_nav.append('g');

        g_dots.selectAll('.dot')
            .data(dots)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', (d) => (d.page - 1) * item_width + item_width / 2)
            .attr('cy', (d) => 4 + d.y * 8)
            .attr('r', 3)
            .style('pointer-events', 'none')
            .attr('fill', (d) => {
                let color = 'rgba(0, 128, 0, 0.25)';
                if (d.data.Problema == 'OK') {
                    color = 'rgba(0, 128, 0, 0.25)';
                } else {
                    color = 'red';
                }
                return color;
            });

        let curr_pag = 66;

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
                    self.updatePage(page, pages[page]);
                    return (page - 1) * item_width;
                });
        }

        function dragended(d) {
            d3.select(this).classed("active", false);
        }

        self.updatePage(curr_pag, pages[curr_pag]);
    }

    self.updatePage = (p, data) => {
        const box = d3.select('#box');

        self.page_title
            .text('Página ' + p);

        self.g_page.selectAll('.hl').remove();
        self.g_page.selectAll('.hl_text').remove();
        box.selectAll('.item').remove();
        if (data == undefined) return;

        const hl_min = 100;

        data.forEach((d, i) => {
            const j = Math.floor(self.lines_n / data.length) * i + 2;
            const x = j % 10 == 0 ? 20 : 0;
            const page_offset = self.page_y + self.page_padd;
            const bar_height = self.lines_height + self.lines_padd;

            d.x = Math.random() * (self.page_width - 2 * self.page_padd);
            d.x = Math.min(d.x, self.page_width - 2 * self.page_padd - hl_min);
            d.x = self.page_padd + d.x + x;
            d.y = page_offset + j * (bar_height);

            let w = Math.random() * (self.page_width - 2 * self.page_padd - d.x);
            d.w = Math.max(hl_min, w) - x;

            if (i % 2 == 0) {
                d.points = [{
                        x: d.x,
                        y: d.y
                    },
                    {
                        x: -15,
                        y: d.y - 30
                    },
                    {
                        x: -40,
                        y: d.y - 30
                    }
                ];
            } else {
                d.points = [{
                        x: d.x + d.w,
                        y: d.y
                    },
                    {
                        x: self.page_width + 15,
                        y: d.y - 50
                    },
                    {
                        x: self.page_width + 40,
                        y: d.y - 50
                    }
                ];
            }
        });

        console.log(data);

        // Highlight lines
        self.g_page.selectAll('.hl')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'hl')
            .attr('x', (d, i) => d.x)
            .attr('y', (d, i) => d.y)
            .attr('width', (d, i) => d.w)
            .attr('height', self.lines_height)
            .attr('fill', (d) => {
                let color = 'rgba(0, 128, 0, 0.25)';
                if (d.Problema == 'OK') {
                    color = 'rgba(0, 128, 0, 0.25)';
                } else {
                    color = 'red';
                }
                return color;
            });


        const line = d3.line()
            .x((d) => d.x)
            .y((d) => d.y);

        // Annotations
        self.g_page.selectAll('.hl_text')
            .data(data)
            .enter()
            .append('path')
            .attr('class', 'hl_text')
            .attr('d', (d) => line(d.points))
            .attr('fill', 'transparent')
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5)
            .attr('marker-end', 'url(#arrow)');

        box.selectAll('.item')
            .data(data)
            .enter()
            .append('div')
            .attr('class', 'item')
            .style('left', (d, i) => {
                if (i % 2 == 0) {
                    return self.page_x + (d.points[2].x - 240) + 'px';
                } else {
                    return self.page_x + (d.points[2].x) + 'px';
                }
            })
            .style('top', (d, i) => (d.points[2].y) + 'px')
            .text((d) => {
                return d.Problema;
            });
    }

    self.init();
    return self;
}

(async () => {
    const bfc = BFC({
        parent_id: 'root',
        width: 1000,
        height: 500,
    });

    const data = await d3.csv("data.csv");
    bfc.render(data);
})();